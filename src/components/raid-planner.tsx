import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { useForm } from '@tanstack/react-form'
import {
  Check,
  GripVertical,
  Link2,
  MousePointerClick,
  RotateCcw,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties, MutableRefObject } from 'react'

import { AuthMenu } from '#/components/auth-menu'
import {
  PresetMenu,
  SaveRaidButton,
} from '#/components/preset-menu'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { specClasses, specsById } from '#/data/specs'
import type { GroupBuff, SpecDefinition } from '#/data/specs'
import {
  GROUP_SIZE,
  MAX_PLAYER_NAME_LENGTH,
  RAID_SIZES,
  addSpecToFirstOpenSlot,
  addSpecToSlot,
  createEmptyRaid,
  getRaidSize,
  moveMember,
  raidGroupCount,
  removeMember,
  resizeRaid,
  updateMemberName,
} from '#/lib/raid-state'
import type { RaidMember, RaidSize, RaidState } from '#/lib/raid-state'
import type { AuthUser } from '#/lib/session'

type DragData =
  { source: 'palette'; specId: string } | { source: 'slot'; slotIndex: number }

type RaidPlannerProps = {
  state: RaidState
  onStateChange: (state: RaidState) => void
  user: AuthUser | null
}

export function RaidPlanner({
  state,
  onStateChange,
  user,
}: RaidPlannerProps) {
  const [activeDrag, setActiveDrag] = useState<DragData | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'error'>(
    'idle',
  )
  const draggedRef = useRef(false)
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 4 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
    useSensor(KeyboardSensor),
  )
  const raidSize = getRaidSize(state)
  const groupCount = raidGroupCount(raidSize)
  const memberCount = state.slots.filter(Boolean).length
  const openSlots = raidSize - memberCount

  const addSpec = (specId: string) => {
    const nextState = addSpecToFirstOpenSlot(state, specId)

    if (!nextState) {
      setNotice(
        'Your raid is full. Remove a player before adding another spec.',
      )
      return
    }

    onStateChange(nextState)
    setNotice(null)
  }

  const changeRaidSize = (size: RaidSize) => {
    if (size === raidSize) {
      return
    }

    const droppedCount = state.slots
      .slice(size)
      .filter((slot) => slot !== null).length

    onStateChange(resizeRaid(state, size))
    setNotice(
      droppedCount === 0
        ? null
        : droppedCount === 1
          ? '1 player did not fit in the smaller raid and was removed.'
          : `${droppedCount} players did not fit in the smaller raid and were removed.`,
    )
  }

  const handleDragStart = ({ active }: DragStartEvent) => {
    const data = active.data.current as DragData | undefined

    if (data) {
      draggedRef.current = true
      setActiveDrag(data)
    }
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    const data = active.data.current as DragData | undefined
    const slotIndex = over?.data.current?.slotIndex as number | undefined

    setActiveDrag(null)
    window.setTimeout(() => {
      draggedRef.current = false
    }, 0)

    if (!data || slotIndex === undefined) {
      return
    }

    if (data.source === 'palette') {
      const nextState = addSpecToSlot(state, data.specId, slotIndex)

      if (!nextState) {
        setNotice('That slot is occupied. Drop new specs into an empty slot.')
        return
      }

      onStateChange(nextState)
      setNotice(null)
      return
    }

    onStateChange(moveMember(state, data.slotIndex, slotIndex))
    setNotice(null)
  }

  const copyShareLink = async () => {
    try {
      await copyText(window.location.href)
      setShareStatus('copied')
      window.setTimeout(() => setShareStatus('idle'), 5_000)
    } catch {
      setShareStatus('error')
    }
  }

  const activeSpec =
    activeDrag?.source === 'palette'
      ? specsById.get(activeDrag.specId)
      : activeDrag?.source === 'slot'
        ? specsById.get(state.slots[activeDrag.slotIndex]?.specId ?? '')
        : undefined

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragCancel={() => {
        setActiveDrag(null)
        draggedRef.current = false
      }}
      onDragEnd={handleDragEnd}
    >
      <PresetMenu user={user} state={state}>
        <div className="planner-shell">
        <header className="planner-header">
          <div className="header-brand-row">
            <div className="brand-lockup">justraidplanner</div>
            <div className="raid-size-control">
              <span className="raid-size-label" id="raid-size-label">
                Raid size
              </span>
              <div
                className="raid-size-switcher"
                role="radiogroup"
                aria-labelledby="raid-size-label"
              >
                {RAID_SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    role="radio"
                    aria-checked={raidSize === size}
                    aria-label={`${size}-player raid`}
                    data-selected={raidSize === size || undefined}
                    onClick={() => changeRaidSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="header-toolbar">
            <div className="header-actions">
              <Button
                type="button"
                variant="outline"
                onClick={() => onStateChange(createEmptyRaid(raidSize))}
                disabled={memberCount === 0}
              >
                <RotateCcw />
                Reset
              </Button>
              <Button
                type="button"
                onClick={copyShareLink}
                aria-label={
                  shareStatus === 'copied' ? 'Link copied' : 'Copy share link'
                }
              >
                {shareStatus === 'copied' ? <Check /> : <Link2 />}
                <span className="action-label-full">
                  {shareStatus === 'copied' ? 'Link copied' : 'Copy share link'}
                </span>
                <span className="action-label-short" aria-hidden="true">
                  {shareStatus === 'copied' ? 'Copied' : 'Share'}
                </span>
              </Button>
            </div>
            <AuthMenu user={user} />
          </div>
        </header>

        <section className="planner-intro">
          <div>
            <p className="eyebrow">{raidSize}-player raids</p>
            <h1>Build the raid around the people.</h1>
          </div>
          <div
            className="roster-count"
            aria-label={`${memberCount} of ${raidSize} raid slots filled`}
          >
            <Users aria-hidden="true" />
            <div>
              <strong>
                {memberCount}
                <span>/{raidSize}</span>
              </strong>
              <small>
                {openSlots} open slot{openSlots === 1 ? '' : 's'}
              </small>
            </div>
          </div>
        </section>

        <div className="planner-instructions" role="note">
          <MousePointerClick aria-hidden="true" />
          <span>
            Click a spec to add it to the next open slot, or drag it exactly
            where you want it. Drag filled slots to move or swap players.
          </span>
        </div>

        {notice ? (
          <div className="inline-notice" role="status">
            {notice}
            <button
              type="button"
              onClick={() => setNotice(null)}
              aria-label="Dismiss notice"
            >
              <X />
            </button>
          </div>
        ) : null}

        {shareStatus === 'error' ? (
          <div className="inline-notice error-notice" role="alert">
            We could not access your clipboard. Copy the URL from your browser
            instead.
            <button
              type="button"
              onClick={() => setShareStatus('idle')}
              aria-label="Dismiss clipboard error"
            >
              <X />
            </button>
          </div>
        ) : null}

        <main className="planner-layout">
          <aside className="spec-palette" aria-labelledby="spec-palette-title">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Roster palette</p>
                <h2 id="spec-palette-title">Specs</h2>
              </div>
              <span className="section-heading-meta">27 specializations</span>
              <span className="spec-palette-hint">Tap a spec to add</span>
            </div>
            <div className="class-list">
              {specClasses.map((classDefinition) => (
                <section
                  className="class-section"
                  key={classDefinition.id}
                  style={
                    { '--class-color': classDefinition.color } as CSSProperties
                  }
                >
                  <h3>
                    <span aria-hidden="true" />
                    {classDefinition.name}
                  </h3>
                  <div className="spec-grid">
                    {classDefinition.specs.map((spec) => (
                      <SpecTile
                        key={spec.id}
                        spec={spec}
                        draggedRef={draggedRef}
                        onAdd={() => addSpec(spec.id)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </aside>

          <section className="raid-board" aria-labelledby="raid-groups-title">
            <div className="section-heading raid-heading">
              <div>
                <p className="eyebrow">Your composition</p>
                <div className="raid-heading-title">
                  <h2 id="raid-groups-title">Raid groups</h2>
                  <SaveRaidButton />
                </div>
              </div>
              <span>
                {groupCount} groups · {GROUP_SIZE} players each
              </span>
            </div>

            {memberCount === 0 ? (
              <div className="empty-roster" role="status">
                <span aria-hidden="true">01</span>
                <div>
                  <strong>Your raid starts with one pick.</strong>
                  <p>
                    Choose a spec from the palette to begin building the roster.
                  </p>
                </div>
              </div>
            ) : null}

            <div className="group-grid">
              {Array.from({ length: groupCount }, (_, groupIndex) => (
                <RaidGroup
                  key={groupIndex}
                  groupIndex={groupIndex}
                  slots={state.slots.slice(
                    groupIndex * GROUP_SIZE,
                    groupIndex * GROUP_SIZE + GROUP_SIZE,
                  )}
                  onRemove={(slotIndex) =>
                    onStateChange(removeMember(state, slotIndex))
                  }
                  onNameChange={(slotIndex, name) =>
                    onStateChange(updateMemberName(state, slotIndex, name))
                  }
                />
              ))}
            </div>
          </section>
        </main>

        <footer>
          <p>
            {user
              ? 'Your roster lives in this URL, and signed-in profiles can also save named presets.'
              : 'Your roster lives in this URL. Create a profile if you want named presets on this device and others.'}
          </p>
          <span>Party buffs are shown by specialization.</span>
        </footer>
        </div>
      </PresetMenu>

      <DragOverlay dropAnimation={null}>
        {activeSpec ? <SpecDragPreview spec={activeSpec} /> : null}
      </DragOverlay>
    </DndContext>
  )
}

function SpecTile({
  spec,
  onAdd,
  draggedRef,
}: {
  spec: SpecDefinition
  onAdd: () => void
  draggedRef: MutableRefObject<boolean>
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${spec.id}`,
    data: { source: 'palette', specId: spec.id } satisfies DragData,
  })

  return (
    <button
      ref={setNodeRef}
      type="button"
      className="spec-tile"
      data-dragging={isDragging || undefined}
      onClick={() => {
        if (!draggedRef.current) {
          onAdd()
        }
      }}
      title={`Add ${spec.name} ${spec.className}`}
      {...listeners}
      {...attributes}
    >
      <img src={spec.icon} alt="" draggable={false} />
      <span>{spec.name}</span>
    </button>
  )
}

function RaidGroup({
  groupIndex,
  slots,
  onRemove,
  onNameChange,
}: {
  groupIndex: number
  slots: Array<RaidMember | null>
  onRemove: (slotIndex: number) => void
  onNameChange: (slotIndex: number, name: string) => void
}) {
  const buffs = collectBuffs(slots)
  const filledSlots = slots.filter(Boolean).length

  return (
    <article className="raid-group">
      <div className="group-header">
        <div>
          <span>{String(groupIndex + 1).padStart(2, '0')}</span>
          <h3>Group {groupIndex + 1}</h3>
        </div>
        <small>
          {filledSlots}/{GROUP_SIZE}
        </small>
      </div>

      <div className="slot-list">
        {slots.map((member, index) => {
          const slotIndex = groupIndex * GROUP_SIZE + index
          return (
            <PlayerSlot
              key={slotIndex}
              member={member}
              slotIndex={slotIndex}
              onRemove={() => onRemove(slotIndex)}
              onNameChange={(name) => onNameChange(slotIndex, name)}
            />
          )
        })}
      </div>

      <div className="group-buffs">
        <div className="buff-heading">
          <Sparkles aria-hidden="true" />
          <span>Group buffs</span>
        </div>
        {buffs.length === 0 ? (
          <p className="no-buffs">No active group buffs</p>
        ) : (
          <ul>
            {buffs.map((buff) => (
              <li key={buff.id} title={buff.description}>
                {buff.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  )
}

function PlayerSlot({
  member,
  slotIndex,
  onRemove,
  onNameChange,
}: {
  member: RaidMember | null
  slotIndex: number
  onRemove: () => void
  onNameChange: (name: string) => void
}) {
  const spec = member ? specsById.get(member.specId) : undefined
  const {
    attributes,
    listeners,
    setNodeRef: setDraggableRef,
    setActivatorNodeRef,
    isDragging,
  } = useDraggable({
    id: `member-${slotIndex}`,
    disabled: !member,
    data: { source: 'slot', slotIndex } satisfies DragData,
  })
  const { isOver, setNodeRef: setDroppableRef } = useDroppable({
    id: `slot-${slotIndex}`,
    data: { slotIndex },
  })
  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      setDraggableRef(node)
      setDroppableRef(node)
    },
    [setDraggableRef, setDroppableRef],
  )

  if (!member || !spec) {
    return (
      <div
        ref={setRefs}
        className="player-slot empty-slot"
        data-over={isOver || undefined}
      >
        <span aria-hidden="true">
          {String((slotIndex % GROUP_SIZE) + 1).padStart(2, '0')}
        </span>
        <p>Open slot</p>
      </div>
    )
  }

  return (
    <div
      ref={setRefs}
      className="player-slot filled-slot"
      data-over={isOver || undefined}
      data-dragging={isDragging || undefined}
      style={{ '--spec-color': spec.color } as CSSProperties}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        className="drag-handle"
        aria-label={`Move ${member.name || spec.name} ${spec.className}`}
        title="Drag this handle to move or swap"
        {...listeners}
        {...attributes}
      >
        <GripVertical />
      </button>
      <img
        src={spec.icon}
        alt={`${spec.name} ${spec.className}`}
        draggable={false}
      />
      <div className="player-details">
        <PlayerNameForm name={member.name} onNameChange={onNameChange} />
        <span>
          {spec.name} {spec.className}
        </span>
      </div>
      <button
        type="button"
        className="remove-player"
        onClick={onRemove}
        aria-label={`Remove ${member.name || spec.name} from group`}
        title="Remove player"
      >
        <X />
      </button>
    </div>
  )
}

function PlayerNameForm({
  name,
  onNameChange,
}: {
  name: string
  onNameChange: (name: string) => void
}) {
  const form = useForm({
    defaultValues: { name },
    onSubmit: ({ value }) => onNameChange(value.name),
  })

  useEffect(() => {
    if (form.getFieldValue('name') !== name) {
      form.setFieldValue('name', name)
    }
  }, [form, name])

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        void form.handleSubmit()
      }}
    >
      <form.Field
        name="name"
        validators={{
          onChange: ({ value }) =>
            value.length > MAX_PLAYER_NAME_LENGTH
              ? `Use ${MAX_PLAYER_NAME_LENGTH} characters or fewer`
              : undefined,
        }}
      >
        {(field) => (
          <Input
            name={field.name}
            value={field.state.value}
            maxLength={MAX_PLAYER_NAME_LENGTH}
            placeholder="Player name"
            autoComplete="off"
            aria-label="Player name"
            aria-invalid={!field.state.meta.isValid}
            onBlur={field.handleBlur}
            onChange={(event) => {
              const nextName = event.target.value
              field.handleChange(nextName)
              onNameChange(nextName)
            }}
          />
        )}
      </form.Field>
    </form>
  )
}

function SpecDragPreview({ spec }: { spec: SpecDefinition }) {
  return (
    <div
      className="drag-preview"
      style={{ '--spec-color': spec.color } as CSSProperties}
    >
      <img src={spec.icon} alt="" />
      <div>
        <strong>{spec.name}</strong>
        <span>{spec.className}</span>
      </div>
    </div>
  )
}

function collectBuffs(slots: Array<RaidMember | null>) {
  const buffs = new Map<string, GroupBuff>()

  for (const member of slots) {
    const spec = member ? specsById.get(member.specId) : undefined

    for (const buff of spec?.buffs ?? []) {
      buffs.set(buff.id, buff)
    }
  }

  return Array.from(buffs.values())
}

async function copyText(value: string) {
  const clipboard = Reflect.get(navigator, 'clipboard') as Clipboard | undefined

  if (clipboard !== undefined) {
    await clipboard.writeText(value)
    return
  }

  const input = document.createElement('textarea')
  input.value = value
  input.style.position = 'fixed'
  input.style.opacity = '0'
  document.body.appendChild(input)
  input.select()
  const copied = document.execCommand('copy')
  input.remove()

  if (!copied) {
    throw new Error('Clipboard unavailable')
  }
}
