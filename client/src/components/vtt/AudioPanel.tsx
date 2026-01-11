import { useTranslation } from '../../i18n/TranslationContext';

import React, { useState, useEffect } from 'react';
import { DraggableWindow } from '../ui/DraggableWindow';
import { useGameSession } from '../../context/GameSessionContext';
import { Playlist, SoundEffect } from '../../types';
import { Music, Volume2, Pause, Play, PowerOff, Shuffle, Settings, Trash2, Plus, Save, ArrowLeft, UploadCloud, Repeat, Loader2 } from 'lucide-react';
import { audioService } from '../../services/audioService';
import { socketService } from '../../services/socketService';
import { fileService } from '../../services/fileService';
import { Button } from '../ui/Button';
import { SheetInput } from '../ui/SheetPrimitives';
import { useNotification } from '../../context/NotificationContext';

interface AudioPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AudioPanel: React.FC<AudioPanelProps> = ({ isOpen, onClose }) => {
    const { audioSettings, updateAudioSettings } = useGameSession();
    const { show } = useNotification();
    const { t } = useTranslation();

    const [musicVolume, setMusicVolume] = useState(audioService.getMusicVolume());
    const [sfxVolume, setSfxVolume] = useState(audioService.getSfxVolume());
    const [currentMusicUrl, setCurrentMusicUrl] = useState<string | null>(audioService.getCurrentMusicUrl());
    const [isMusicPaused, setIsMusicPaused] = useState(audioService.getIsMusicPaused());

    const [isManaging, setIsManaging] = useState(false);
    const [trackLoopStates, setTrackLoopStates] = useState<Record<string, boolean>>({});
    const [loopingSfxUrls, setLoopingSfxUrls] = useState<Set<string>>(audioService.getLoopingSfx());

    const [localPlaylists, setLocalPlaylists] = useState<Playlist[]>(audioSettings.playlists);
    const [localSoundboard, setLocalSoundboard] = useState<SoundEffect[]>(audioSettings.soundboard);
    const [newPlaylistName, setNewPlaylistName] = useState('');

    // State to track which input is uploading
    const [uploadingIndex, setUploadingIndex] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setMusicVolume(audioService.getMusicVolume());
            setSfxVolume(audioService.getSfxVolume());
            const currentSrc = audioService.getCurrentMusicUrl();
            setCurrentMusicUrl(currentSrc ? decodeURI(currentSrc) : null);
            setIsMusicPaused(audioService.getIsMusicPaused());
            setLoopingSfxUrls(audioService.getLoopingSfx());
            setLocalPlaylists(audioSettings.playlists);
            setLocalSoundboard(audioSettings.soundboard);
        }
    }, [isOpen, audioSettings]);

    useEffect(() => {
        if (!isOpen) return;
        const interval = setInterval(() => {
            const srvUrl = audioService.getCurrentMusicUrl();
            const decodedSrvUrl = srvUrl ? decodeURI(srvUrl) : null;
            if (decodedSrvUrl !== currentMusicUrl) setCurrentMusicUrl(decodedSrvUrl);
            const paused = audioService.getIsMusicPaused();
            if (paused !== isMusicPaused) setIsMusicPaused(paused);
        }, 1000);
        return () => clearInterval(interval);
    }, [isOpen, currentMusicUrl, isMusicPaused]);

    useEffect(() => {
        const initialLoopStates: Record<string, boolean> = {};
        audioSettings.playlists.forEach(p => p.tracks.forEach(t => { initialLoopStates[t.url] = true; }));
        setTrackLoopStates(initialLoopStates);
    }, [audioSettings.playlists]);

    const handleFileUpload = async (
        e: React.ChangeEvent<HTMLInputElement>,
        type: 'track' | 'sfx',
        index1: number,
        index2?: number
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const uploadKey = `${type}-${index1}-${index2 ?? ''}`;
        setUploadingIndex(uploadKey);

        const response = await fileService.upload(file);
        setUploadingIndex(null);

        if (response.success && response.data) {
            const url = response.data;
            if (type === 'track' && index2 !== undefined) {
                const newPlaylists = [...localPlaylists];
                newPlaylists[index1].tracks[index2].url = url;
                setLocalPlaylists(newPlaylists);
            } else if (type === 'sfx') {
                const newSfx = [...localSoundboard];
                newSfx[index1].url = url;
                setLocalSoundboard(newSfx);
            }
        } else {
            show({ type: 'error', message: response.message || t('vtt.audio.panel.erroNoUpload.errorMessage') });
        }
    };

    const handleMusicVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => { const newVolume = parseFloat(e.target.value); setMusicVolume(newVolume); audioService.setMusicVolume(newVolume); };
    const handleSfxVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => { const newVolume = parseFloat(e.target.value); setSfxVolume(newVolume); audioService.setSfxVolume(newVolume); };

    const handleToggleTrackLoop = (url: string) => {
        const newLoopState = !(trackLoopStates[url] ?? true);
        setTrackLoopStates(prev => ({ ...prev, [url]: newLoopState }));
        if (currentMusicUrl && decodeURI(currentMusicUrl).includes(decodeURI(url))) audioService.updateCurrentMusicLoop(newLoopState);
    };

    const handleTrackClick = (url: string) => {
        const decodedUrl = decodeURI(url);
        const isActive = currentMusicUrl && decodeURI(currentMusicUrl).endsWith(decodedUrl);
        const shouldLoop = trackLoopStates[url] ?? true;

        if (isActive && !isMusicPaused) {
            audioService.pauseMusic();
            setIsMusicPaused(true);
            socketService.emit('audio:pause');
            console.log('[AUDIO] Paused and emitted to WebSocket');
        }
        else if (isActive && isMusicPaused) {
            audioService.resumeMusic();
            setIsMusicPaused(false);
            socketService.emit('audio:play', { url, loop: shouldLoop });
            console.log('[AUDIO] Resumed and emitted to WebSocket');
        }
        else {
            audioService.playMusic(url, shouldLoop);
            setCurrentMusicUrl(decodedUrl);
            setIsMusicPaused(false);
            socketService.emit('audio:play', { url, loop: shouldLoop });
            console.log('[AUDIO] Playing and emitted to WebSocket:', url);
        }
    };

    const handleShufflePlay = (playlistId: string) => {
        const playlist = audioSettings.playlists.find(p => p.id === playlistId);
        if (playlist && playlist.tracks.length > 0) {
            const randomTrack = playlist.tracks[Math.floor(Math.random() * playlist.tracks.length)];
            const shouldLoop = trackLoopStates[randomTrack.url] ?? true;
            audioService.playMusic(randomTrack.url, shouldLoop);
            setCurrentMusicUrl(decodeURI(randomTrack.url));
            setIsMusicPaused(false);
            socketService.emit('audio:play', { url: randomTrack.url, loop: shouldLoop });
            console.log('[AUDIO] Shuffle play and emitted to WebSocket:', randomTrack.url);
        }
    };

    const handleStopMusic = () => {
        audioService.stopMusic();
        setCurrentMusicUrl(null);
        setIsMusicPaused(false);
        setLoopingSfxUrls(new Set());
        socketService.emit('audio:stop');
        console.log('[AUDIO] Stopped and emitted to WebSocket');
    };
    const handleToggleSfxLoop = (url: string) => {
        const wasLooping = loopingSfxUrls.has(url);
        audioService.toggleSfxLoop(url);
        setLoopingSfxUrls(audioService.getLoopingSfx());

        // Emit to WebSocket for synchronization
        const isNowLooping = audioService.getLoopingSfx().has(url);
        socketService.emit('audio:sfx', { url, action: isNowLooping ? 'start' : 'stop' });
        console.log('[AUDIO] SFX toggled and emitted to WebSocket:', url, isNowLooping ? 'start' : 'stop');
    };
    const handleSaveChanges = () => { updateAudioSettings({ playlists: localPlaylists, soundboard: localSoundboard }); setIsManaging(false); };

    const renderManager = () => (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
            <div>
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">{t('vtt.audio.panel.gerenciarPlaylists.text')}</h3>
                <div className="space-y-2">
                    {localPlaylists.map((p, pIndex) => (
                        <div key={p.id} className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-700 space-y-2">
                            <div className="flex justify-between items-center">
                                <SheetInput variant="ghost" value={p.name} onChange={e => { const newPlaylists = [...localPlaylists]; newPlaylists[pIndex].name = e.target.value; setLocalPlaylists(newPlaylists); }} className="font-bold !p-1" />
                                <button onClick={() => setLocalPlaylists(localPlaylists.filter(pl => pl.id !== p.id))} className="text-zinc-500 hover:text-red-400 p-1"><Trash2 className="w-4 h-4" /></button>
                            </div>
                            {p.tracks.map((t, tIndex) => {
                                const uploadKey = `track-${pIndex}-${tIndex}`;
                                const isUploading = uploadingIndex === uploadKey;
                                return (
                                    <div key={tIndex} className="flex gap-2 items-center bg-zinc-900/50 p-1 rounded">
                                        <SheetInput variant="ghost" placeholder="Nome" value={t.name} onChange={e => { const newPlaylists = [...localPlaylists]; newPlaylists[pIndex].tracks[tIndex].name = e.target.value; setLocalPlaylists(newPlaylists); }} className="text-xs flex-1" />
                                        <SheetInput variant="ghost" placeholder="URL" value={t.url} onChange={e => { const newPlaylists = [...localPlaylists]; newPlaylists[pIndex].tracks[tIndex].url = e.target.value; setLocalPlaylists(newPlaylists); }} className="text-xs flex-1" />
                                        <input type="file" id={`up-${uploadKey}`} className="hidden" accept=".mp3,.wav,.ogg,.m4a,.flac,.aac,audio/mpeg,audio/wav,audio/ogg,audio/aac,audio/flac,audio/mp4" onChange={(e) => handleFileUpload(e, 'track', pIndex, tIndex)} />
                                        <label htmlFor={`up-${uploadKey}`} className={`cursor-pointer text-zinc-500 hover:text-primary p-1 ${isUploading ? 'animate-pulse pointer-events-none' : ''}`}>
                                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                                        </label>
                                        <button onClick={() => { const newPlaylists = [...localPlaylists]; newPlaylists[pIndex].tracks.splice(tIndex, 1); setLocalPlaylists(newPlaylists); }} className="text-zinc-600 hover:text-red-400 p-1"><Trash2 className="w-3 h-3" /></button>
                                    </div>
                                );
                            })}
                            <Button size="sm" variant="ghost" onClick={() => { const newPlaylists = [...localPlaylists]; newPlaylists[pIndex].tracks.push({ name: t('vtt.audio.panel.novaFaixa.label'), url: '' }); setLocalPlaylists(newPlaylists); }}><Plus className="w-3 h-3 mr-1" />{t('vtt.audio.panel.faixa.label')}</Button>
                        </div>
                    ))}
                </div>
                <form onSubmit={(e) => { e.preventDefault(); setLocalPlaylists([...localPlaylists, { id: Date.now().toString(), name: newPlaylistName, tracks: [] }]); setNewPlaylistName(''); }} className="flex gap-2 mt-3">
                    <SheetInput variant="box" placeholder={t('vtt.audio.panel.nomeDaNova.placeholder')} value={newPlaylistName} onChange={e => setNewPlaylistName(e.target.value)} />
                    <Button type="submit"><Plus className="w-4 h-4" /></Button>
                </form>
            </div>
            <div className="h-px bg-zinc-700 my-4" />
            <div>
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">{t('vtt.audio.panel.gerenciarEfeitosSonoros.text')}</h3>
                <div className="space-y-2">
                    {localSoundboard.map((sfx, sfxIndex) => {
                        const uploadKey = `sfx-${sfxIndex}-`;
                        const isUploading = uploadingIndex === uploadKey;
                        return (
                            <div key={sfx.id} className="flex gap-2 items-center bg-zinc-800/50 p-1 rounded">
                                <SheetInput variant="ghost" placeholder="Nome" value={sfx.name} onChange={e => { const newSfx = [...localSoundboard]; newSfx[sfxIndex].name = e.target.value; setLocalSoundboard(newSfx); }} className="text-xs flex-1" />
                                <SheetInput variant="ghost" placeholder="URL" value={sfx.url} onChange={e => { const newSfx = [...localSoundboard]; newSfx[sfxIndex].url = e.target.value; setLocalSoundboard(newSfx); }} className="text-xs flex-1" />
                                <input type="file" id={`up-${uploadKey}`} className="hidden" accept=".mp3,.wav,.ogg,.m4a,.flac,.aac,audio/mpeg,audio/wav,audio/ogg,audio/aac,audio/flac,audio/mp4" onChange={(e) => handleFileUpload(e, 'sfx', sfxIndex)} />
                                <label htmlFor={`up-${uploadKey}`} className={`cursor-pointer text-zinc-500 hover:text-primary p-1 ${isUploading ? 'animate-pulse pointer-events-none' : ''}`}>
                                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                                </label>
                                <button onClick={() => setLocalSoundboard(localSoundboard.filter(s => s.id !== sfx.id))} className="text-zinc-600 hover:text-red-400 p-1"><Trash2 className="w-3 h-3" /></button>
                            </div>
                        );
                    })}
                </div>
                <Button size="sm" variant="outline" className="mt-3" onClick={() => setLocalSoundboard([...localSoundboard, { id: Date.now().toString(), name: t('vtt.audio.panel.novoEfeito.label'), url: '' }])}><Plus className="w-3 h-3 mr-1" />{t('vtt.audio.panel.efeitoSonoro.text')}</Button>
            </div>
        </div>
    );

    const renderPlayer = () => (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
            <div>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{t('vtt.audio.panel.playlists.label')}</h3>
                    <button onClick={handleStopMusic} className="flex items-center gap-1 text-xs text-red-400/80 hover:text-red-400 font-bold transition-colors"><PowerOff className="w-3 h-3" />{t('vtt.audio.panel.pararTudo.text')}</button>
                </div>
                <div className="space-y-3">
                    {audioSettings.playlists.map(playlist => (
                        <div key={playlist.id} className="bg-zinc-800/50 border border-zinc-800 rounded-lg p-3">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-sm font-bold text-zinc-300">{playlist.name}</p>
                                <button onClick={() => handleShufflePlay(playlist.id)} className="flex items-center gap-1.5 text-xs bg-zinc-900/50 border border-zinc-700 rounded-full px-2 py-1 text-zinc-400 hover:text-white hover:border-primary/50 transition-colors"><Shuffle className="w-3 h-3" />{t('vtt.audio.panel.aleatrio.label')}</button>
                            </div>
                            <div className="space-y-2">
                                {playlist.tracks.map(track => {
                                    const isActive = currentMusicUrl && decodeURI(currentMusicUrl).endsWith(decodeURI(track.url));
                                    const isPlaying = isActive && !isMusicPaused;
                                    const isPaused = isActive && isMusicPaused;
                                    const isLoopingForThisTrack = trackLoopStates[track.url] ?? true;

                                    return (
                                        <div key={track.url} className="flex gap-2">
                                            <button onClick={() => handleTrackClick(track.url)} className={`flex-1 text-left text-xs border rounded px-2 py-1.5 hover:border-primary/50 hover:bg-primary/20 text-zinc-400 hover:text-white transition-colors truncate flex items-center gap-2 ${isPlaying ? 'bg-primary/20 border-primary/50 text-white' : isPaused ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300' : 'bg-zinc-900/50 border-zinc-700'}`}>
                                                {isPlaying ? <Play className="w-3 h-3 fill-current" /> : isPaused ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3" />}
                                                {track.name}
                                            </button>
                                            <button onClick={() => handleToggleTrackLoop(track.url)} className={`p-1.5 border rounded transition-colors ${isLoopingForThisTrack ? 'text-primary border-primary/30' : 'text-zinc-600 border-zinc-700 hover:text-zinc-300'}`}><Repeat className="w-4 h-4" /></button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div>
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">{t('vtt.audio.panel.efeitosSonoros.text')}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {audioSettings.soundboard.map(sfx => {
                        const isSfxLooping = loopingSfxUrls.has(sfx.url);
                        return <button key={sfx.id} onClick={() => handleToggleSfxLoop(sfx.url)} className={`aspect-square flex items-center justify-center text-center border rounded-lg hover:border-primary text-xs font-bold transition-all ${isSfxLooping ? 'bg-primary/20 border-primary text-primary shadow-md animate-pulse' : 'bg-zinc-800/50 border-zinc-700 text-zinc-300 hover:text-primary'}`}>{sfx.name}</button>;
                    })}
                </div>
            </div>
        </div>
    );

    return (
        <DraggableWindow isOpen={isOpen} onClose={onClose} title={isManaging ? t('vtt.audio.panel.gerenciarUdio.title') : t('vtt.audio.panel.painelDeUdio.title')} icon={<Music className="w-4 h-4" />} initialSize={{ w: Math.min(420, window.innerWidth - 40), h: Math.min(600, window.innerHeight - 100) }} initialPosition={{ x: Math.max(20, window.innerWidth - 460), y: 80 }}>
            <div className="flex flex-col h-full text-white bg-zinc-900/50">
                <div className="p-4 bg-zinc-950/30 border-b border-zinc-800 space-y-3">
                    <div className="flex items-center gap-3"><Music className="w-4 h-4 text-zinc-500" /><input type="range" min="0" max="1" step="0.05" value={musicVolume} onChange={handleMusicVolumeChange} className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-primary" /><span className="text-xs font-mono w-10 text-right">{Math.round(musicVolume * 100)}%</span></div>
                    <div className="flex items-center gap-3"><Volume2 className="w-4 h-4 text-zinc-500" /><input type="range" min="0" max="1" step="0.05" value={sfxVolume} onChange={handleSfxVolumeChange} className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-primary" /><span className="text-xs font-mono w-10 text-right">{Math.round(sfxVolume * 100)}%</span></div>
                </div>
                <div className="shrink-0 bg-zinc-900/50 border-b border-zinc-800 flex items-center justify-between px-4 py-2">
                    {isManaging ? <Button size="sm" variant="ghost" onClick={() => setIsManaging(false)}><ArrowLeft className="w-4 h-4 mr-2" />{t('vtt.audio.panel.voltar.label')}</Button> : <Button size="sm" variant="ghost" onClick={() => setIsManaging(true)}><Settings className="w-4 h-4 mr-2" />{t('vtt.audio.panel.gerenciar.label')}</Button>}
                    {isManaging && <Button size="sm" onClick={handleSaveChanges}><Save className="w-4 h-4 mr-2" />{t('vtt.audio.panel.salvarAlteraes.text')}</Button>}
                </div>
                {isManaging ? renderManager() : renderPlayer()}
            </div>
        </DraggableWindow>
    );
};
