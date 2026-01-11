import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useTranslation } from '../../../i18n/TranslationContext';
import { Playlist, AudioZone } from '../../../types';
import { SheetSelect, SheetInput, SheetLabel, SheetSelectOption } from '../../ui/SheetPrimitives';
import { Button } from '../../ui/Button';
import { UploadCloud, Trash2 } from 'lucide-react';

export const AudioZoneConfigModalContent: React.FC<{
  audioSettings: { playlists: Playlist[]; };
  onSave: (config: { audioUrl: string; volume: number; radius: number; }) => void;
  onClose: () => void;
}> = ({ audioSettings, onSave, onClose }) => {
  const { t } = useTranslation();
  const [audioUrl, setAudioUrl] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const audioTracksForSelect = useMemo(() => {
    const tracks: SheetSelectOption[] = (audioSettings.playlists || []).flatMap(p =>
      p.tracks.map(t => ({ label: `${p.name} - ${t.name}`, value: t.url }))
    );
    return [
      { label: t('vtt.map.modals.audioZone.noMusic.label'), value: '' },
      ...tracks,
      { label: t('vtt.map.modals.audioZone.customUrl.label'), value: 'custom' }
    ];
  }, [audioSettings, t]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => { setCustomUrl(reader.result as string); };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    onSave({ audioUrl: audioUrl === 'custom' ? customUrl : audioUrl, volume: 1.0, radius: 5 });
    onClose();
  };

  return (
    <div className="space-y-4">
      <SheetLabel>{t('vtt.map.modals.audioZone.zoneMusic.label')}</SheetLabel>
      <SheetSelect value={audioUrl} onChange={setAudioUrl} options={audioTracksForSelect} placeholder={t('vtt.map.modals.audioZone.selectTrack.placeholder')} variant="box" />
      {audioUrl === 'custom' && (
        <div className="flex gap-2 items-end mt-2">
          <SheetInput value={customUrl} onChange={e => setCustomUrl(e.target.value)} placeholder={t('vtt.map.modals.audioZone.pasteUrl.placeholder')} variant="box" className="flex-1" />
          <input type="file" ref={fileInputRef} className="hidden" accept=".mp3,.wav,.ogg,.m4a,.flac,.aac,audio/mpeg,audio/wav,audio/ogg,audio/aac,audio/flac,audio/mp4" onChange={handleFileUpload} />
          <Button type="button" variant="outline" size="icon" onClick={() => fileInputRef.current?.click()}><UploadCloud className="w-4 h-4" /></Button>
        </div>
      )}
      <div className="flex justify-end gap-2 mt-6">
        <Button variant="ghost" onClick={onClose}>{t('common.actions.cancel.label')}</Button>
        <Button onClick={handleSave}>{t('vtt.map.modals.audioZone.saveZone.button')}</Button>
      </div>
    </div>
  );
};

export const TriggerZoneConfigModalContent: React.FC<{
  handouts: any[];
  onSave: (handoutId: string) => void;
  onClose: () => void;
  initialHandoutId?: string;
}> = ({ handouts, onSave, onClose, initialHandoutId }) => {
  const { t } = useTranslation();
  const [selectedHandout, setSelectedHandout] = useState(initialHandoutId || '');

  const options = [
    { label: t('vtt.map.modals.triggerZone.selectResource.placeholder'), value: '' },
    ...handouts.map(h => ({ label: h.name, value: h.id }))
  ];

  return (
    <div className="space-y-4">
      <SheetLabel>{t('vtt.map.modals.triggerZone.selectResource.label')}</SheetLabel>
      <SheetSelect
        value={selectedHandout}
        onChange={setSelectedHandout}
        options={options}
        placeholder={t('vtt.map.modals.triggerZone.selectResource.hint')}
        variant="box"
      />
      <p className="text-xs text-zinc-500">
        {t('vtt.map.modals.triggerZone.description.text')}
      </p>
      <div className="flex justify-end gap-2 mt-6">
        <Button variant="ghost" onClick={onClose}>{t('common.actions.cancel.label')}</Button>
        <Button onClick={() => { if (selectedHandout) onSave(selectedHandout); onClose(); }} disabled={!selectedHandout}>{t('vtt.map.modals.triggerZone.saveTrigger.button')}</Button>
      </div>
    </div>
  );
};

export const AudioZoneEditModalContent: React.FC<{
  zone: AudioZone;
  audioSettings: { playlists: Playlist[]; };
  onSave: (updates: Partial<AudioZone>) => void;
  onDelete?: () => void;
  onClose: () => void;
}> = ({ zone, audioSettings, onSave, onDelete, onClose }) => {
  const { t } = useTranslation();
  const [selectedOption, setSelectedOption] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [volume, setVolume] = useState(zone.volume);
  const [radius, setRadius] = useState(zone.radius);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const audioTracksForSelect = useMemo(() => {
    const tracks: SheetSelectOption[] = (audioSettings.playlists || []).flatMap(p =>
      p.tracks.map(t => ({ label: `${p.name} - ${t.name}`, value: t.url }))
    );
    return [
      { label: t('vtt.map.modals.audioZone.noMusic.label'), value: '' },
      ...tracks,
      { label: t('vtt.map.modals.audioZone.customUrl.label'), value: 'custom' }
    ];
  }, [audioSettings, t]);

  useEffect(() => {
    const isCustom = !audioTracksForSelect.some(o => o.value === zone.audioUrl) && zone.audioUrl !== '';
    if (isCustom) {
      setSelectedOption('custom');
      setCustomUrl(zone.audioUrl);
    } else {
      setSelectedOption(zone.audioUrl);
    }
  }, [zone, audioTracksForSelect]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => { setCustomUrl(reader.result as string); };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    onSave({ audioUrl: selectedOption === 'custom' ? customUrl : selectedOption, volume, radius });
    onClose();
  };

  return (
    <div className="space-y-4">
      <SheetLabel>{t('vtt.map.modals.audioZone.zoneMusic.label')}</SheetLabel>
      <SheetSelect value={selectedOption} onChange={setSelectedOption} options={audioTracksForSelect} variant="box" />
      {selectedOption === 'custom' && (
        <div className="flex gap-2 items-end mt-2">
          <SheetInput value={customUrl} onChange={e => setCustomUrl(e.target.value)} placeholder={t('vtt.map.modals.audioZone.pasteUrl.placeholder')} variant="box" className="flex-1" />
          <input type="file" ref={fileInputRef} className="hidden" accept=".mp3,.wav,.ogg,.m4a,.flac,.aac,audio/mpeg,audio/wav,audio/ogg,audio/aac,audio/flac,audio/mp4" onChange={handleFileUpload} />
          <Button type="button" variant="outline" size="icon" onClick={() => fileInputRef.current?.click()}><UploadCloud className="w-4 h-4" /></Button>
        </div>
      )}
      <SheetLabel>{t('vtt.map.modals.audioZone.volume.label')} ({Math.round(volume * 100)}%)</SheetLabel>
      <input type="range" min="0" max="1" step="0.05" value={volume} onChange={e => setVolume(parseFloat(e.target.value))} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-primary" />
      <SheetInput label={t('vtt.map.modals.audioZone.radius.label')} type="number" value={radius} onChange={e => setRadius(Number(e.target.value))} variant="box" />
      <div className="flex justify-between gap-2 mt-6 pt-4 border-t border-zinc-700">
        {onDelete ? (
          <Button variant="destructive" onClick={onDelete}><Trash2 className="w-4 h-4 mr-2" /> {t('vtt.map.modals.audioZone.deleteZone.button')}</Button>
        ) : <div></div>}
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose}>{t('common.actions.cancel.label')}</Button>
          <Button onClick={handleSave}>{t('vtt.map.modals.audioZone.saveChanges.button')}</Button>
        </div>
      </div>
    </div>
  );
};
