# Fix Attack Zone Feature

## Attack Zone Movement
- [x] Add draggedAttackZone state to MapCanvas
- [ ] Add findAttackZoneAt function to MapCanvas
- [ ] Update handleMouseMove for zone dragging
- [ ] Update handleMouseDown for zone click detection
- [ ] Update handleMouseUp for drag completion
- [x] Connect MapCanvas to useAttackZones hook via props

## Attack Zone Context Menu
- [x] Create AttackZoneContextMenu component
  - [x] Add Edit option
  - [x] Add Duplicate option
  - [x] Add Delete option
  - [x] Add proper styling and positioning
- [x] Add context menu state to GameSessionView
- [x] Create handleAttackZoneContextMenu handler
- [x] Implement edit, duplicate, delete handlers
- [x] Render AttackZoneContextMenu component
- [ ] Wire up right-click detection in MapCanvas

## Attack Zone Editing
- [x] AttackZoneConfigModal already supports editing
  - [x] Accepts optional zone prop
  - [x] Pre-populates form with existing zone data
  - [x] Updates modal title based on mode
- [x] Wire up editing in GameSessionView
  - [x] Add editingAttackZoneId state
  - [x] Use updateZone when editing
  - [x] Open modal from context menu

## Real-time Stats Updates
- ✅ useAttackZones already recalculates via useMemo
- ✅ Dependencies include tokens, obstacles, grid
- [ ] Test that stats update when tokens move

## GameSessionView Integration (COMPLETED ✅)
- [x] Add attackZoneContextMenu state
- [x] Add editingAttackZoneId state
- [x] Import AttackZoneContextMenu component
- [x] Add handleAttackZoneContextMenu handler
- [x] Add handleEditAttackZone handler
- [x] Add handleDuplicateAttackZone handler
- [x] Add handleDeleteAttackZone handler
- [x] Pass onAttackZoneContextMenu to MapCanvas
- [x] Pass onUpdateAttackZone to MapCanvas
- [x] Render context menu component
- [x] Render edit modal component

## MapCanvas Integration (IN PROGRESS ⚠️)
- [x] Add onAttackZoneContextMenu prop
- [x] Add onUpdateAttackZone prop
- [x] Destructure attack zone props
- [x] Add draggedAttackZone state
- [ ] Add findAttackZoneAt function
- [ ] Detect attack zone clicks on right-click
- [ ] Call onAttackZoneContextMenu on right-click
- [ ] Detect attack zone clicks on left-click  
- [ ] Initialize drag on left-click
- [ ] Update zone position during drag in handleMouseMove
- [ ] Complete drag on handleMouseUp
- [ ] Cancel drag on right-click or escape

## Testing
- [ ] Test zone movement with multiple zones
- [ ] Test context menu on different zones
- [ ] Test editing zone properties
- [ ] Test real-time stat updates
- [ ] Test with overlapping zones
- [ ] Test with obstacles blocking vision
