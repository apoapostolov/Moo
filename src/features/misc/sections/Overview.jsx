import { useState, useEffect, useCallback } from 'react';
import { MdOutlineDragIndicator } from 'react-icons/md';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  pointerWithin,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import variables from 'config/variables';
import Clock from './overview_skeletons/Clock';
import QuickLinks from './overview_skeletons/QuickLinks';
import Date from './overview_skeletons/Date';
import QuickWeather from './overview_skeletons/QuickWeather';
import WidgetThumb from './overview_skeletons/WidgetThumb';
import {
  WIDGETS,
  ZONES,
  readOrder,
  readPlacement,
  saveOrder,
  savePlacement,
  groupByZone,
  placementFromGroups,
  isWidgetEnabled,
} from 'utils/widgets';

import EventBus from 'utils/eventbus';

// The three zones, in the order they are drawn around the preview.
const ZONE_TITLES = { left: 'Left', center: 'Centre', right: 'Right' };

const widgetLabel = (id) => {
  const widget = WIDGETS.find((item) => item.id === id);

  return widget ? widget.label() : id;
};

/**
 * The row under the pointer wins over the container it sits in, and a container
 * only answers where the pointer is really inside it. Corners alone let a large
 * box on the far side of the panel claim a drop that was aimed at a row.
 */
const collisionDetection = (args) => {
  const hits = pointerWithin(args);

  if (hits.length === 0) return closestCorners(args);

  const row = hits.find((hit) => !ZONES.includes(hit.id));

  return row ? [row] : hits;
};

const SortableItem = ({ id, enabled, onToggle }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <li ref={setNodeRef} style={style} {...attributes} className="sortableItem" data-widget-id={id}>
      <span className="dragHandle" {...listeners}>
        <MdOutlineDragIndicator />
      </span>
      <span style={{ flex: 1 }}>{widgetLabel(id)}</span>
      <input type="checkbox" checked={enabled} onChange={() => onToggle(id)} />
    </li>
  );
};

/**
 * One of the three drop containers. The whole box is the drop target, so a
 * widget can be dropped into a zone that is still empty.
 */
const Zone = ({ zone, items, onToggle, isEnabled }) => {
  const { setNodeRef, isOver } = useDroppable({ id: zone });
  const className = `widgetZone${isOver ? ' widgetZoneOver' : ''}`;

  return (
    <div ref={setNodeRef} className={className} data-zone={zone}>
      <span className="title">{ZONE_TITLES[zone]}</span>
      <SortableContext id={zone} items={items} strategy={verticalListSortingStrategy}>
        <ul className="sortableContainer">
          {items.length === 0 ? <li className="widgetZoneEmpty">Drop a widget here</li> : null}
          {items.map((id) => (
            <SortableItem key={id} id={id} enabled={isEnabled(id)} onToggle={onToggle} />
          ))}
        </ul>
      </SortableContext>
    </div>
  );
};

const Overview = () => {
  const [groups, setGroups] = useState(() => groupByZone(readOrder(), readPlacement()));

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const findZone = useCallback((id) => ZONES.find((zone) => groups[zone].includes(id)), [groups]);

  const zoneFor = (over) => {
    if (!over) return null;

    return ZONES.includes(over.id) ? over.id : findZone(over.id);
  };

  const handleDragOver = ({ active, over }) => {
    const from = findZone(active.id);
    const to = zoneFor(over);

    if (!from || !to || from === to) return;

    setGroups((previous) => {
      const next = {
        left: [...previous.left],
        center: [...previous.center],
        right: [...previous.right],
      };

      next[from] = next[from].filter((id) => id !== active.id);

      const overIndex = next[to].indexOf(over.id);

      if (overIndex >= 0) next[to].splice(overIndex, 0, active.id);
      else next[to].push(active.id);

      return next;
    });
  };

  /**
   * Which row the dragged card was left over. `over` is usually a row, but the
   * container itself is a drop target too, and then there is no row to take an
   * index from: the card's own centre answers instead.
   */
  const dropIndex = (zone, active, over) => {
    if (groups[zone].includes(over?.id)) return groups[zone].indexOf(over.id);

    const dragged = active.rect?.current?.translated;

    if (!dragged) return -1;

    const centre = dragged.top + dragged.height / 2;
    // The dragged card keeps its place in the list and follows the pointer, so
    // it is always the nearest row to itself. It has to be left out, or dropping
    // into the space between rows would resolve to where the card already is.
    const rows = [
      ...document.querySelectorAll(`.widgetZone[data-zone="${zone}"] .sortableItem`),
    ].filter((row) => row.dataset.widgetId !== active.id);

    let best = -1;
    let nearest = Infinity;

    rows.forEach((row) => {
      const box = row.getBoundingClientRect();
      const distance = Math.abs(box.top + box.height / 2 - centre);

      if (distance < nearest) {
        nearest = distance;
        best = groups[zone].indexOf(row.dataset.widgetId);
      }
    });

    return best;
  };

  const handleDragEnd = ({ active, over }) => {
    const from = findZone(active.id);
    const to = zoneFor(over);

    if (!from || !to || from !== to) return;

    const target = dropIndex(from, active, over);
    const current = groups[from].indexOf(active.id);

    if (target < 0 || target === current) return;

    setGroups((previous) => ({
      ...previous,
      [from]: arrayMove(previous[from], current, target),
    }));
  };

  const toggleEnabled = (id) => {
    const widget = WIDGETS.find((item) => item.id === id);

    if (!widget) return;

    const current = localStorage.getItem(widget.setting) === 'true';

    localStorage.setItem(widget.setting, String(!current));
    variables.stats.postEvent('setting', 'Widget toggle');
    EventBus.emit('refresh', 'widgets');
    // The checkbox state lives in localStorage, so the list is re-read rather
    // than tracked twice.
    setGroups((previous) => ({ ...previous }));
  };

  // Every drop writes both halves of the layout: the order inside a zone and the
  // zone itself, which is what the page reads when it decides where to draw.
  useEffect(() => {
    saveOrder([...groups.left, ...groups.center, ...groups.right]);
    savePlacement(placementFromGroups(groups));
    variables.stats.postEvent('setting', 'Widget placement');
    EventBus.emit('refresh', 'widgets');
  }, [groups]);

  const previewItem = (id) => {
    switch (id) {
      case 'time':
        return <Clock />;
      case 'date':
        return <Date />;
      case 'quickweather':
        return <QuickWeather />;
      case 'quicklinks':
        return <QuickLinks />;
      case 'aiask':
        // The query line has no card to fake: it is a hint and a hairline, so
        // that is what the preview draws.
        return (
          <div className="aiAskSkeleton" aria-hidden="true">
            <span className="aiAskSkeletonText" />
            <span className="aiAskSkeletonLine" />
          </div>
        );
      // Weather Full is the page's own corner card. A skeleton of it sat in the
      // preview's bottom corner like a squashed copy of the real thing, and the
      // zone list right beside the preview already names it, so it draws nothing.
      case 'photoinfo':
      case 'mail':
      case 'calendar':
      case 'tasks':
        return <WidgetThumb type={id} label={widgetLabel(id)} />;
      default:
        return null;
    }
  };

  const previewZone = (zone) => (
    <div className={`previewZone previewZone-${zone}`}>
      {groups[zone]
        .filter((id) => isWidgetEnabled(id))
        .map((id) => ({ id, node: previewItem(id) }))
        .filter(({ node }) => node !== null)
        .map(({ id, node }) => (
          <div className="previewItem" key={`preview-${id}`}>
            {node}
          </div>
        ))}
    </div>
  );

  return (
    <>
      <span className="mainTitle">
        {variables.getMessage('modals.main.marketplace.product.overview')}
      </span>

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="overviewZones">
          <div className="overviewSide overviewSide-left">
            <Zone
              zone="left"
              items={groups.left}
              onToggle={toggleEnabled}
              isEnabled={isWidgetEnabled}
            />
          </div>

          <div className="overviewPreview">
            <span className="title">{variables.getMessage('modals.welcome.buttons.preview')}</span>
            <div className="tabPreview">
              {previewZone('left')}
              {previewZone('center')}
              {previewZone('right')}
            </div>
          </div>

          <div className="overviewSide overviewSide-right">
            <Zone
              zone="right"
              items={groups.right}
              onToggle={toggleEnabled}
              isEnabled={isWidgetEnabled}
            />
          </div>

          <div className="overviewBelow">
            <Zone
              zone="center"
              items={groups.center}
              onToggle={toggleEnabled}
              isEnabled={isWidgetEnabled}
            />
          </div>
        </div>
      </DndContext>
    </>
  );
};

export { Overview as default, Overview };
