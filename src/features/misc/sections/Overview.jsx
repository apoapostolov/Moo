import { useState, useEffect, useCallback, useRef } from 'react';
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
  readSecondLane,
  saveOrder,
  savePlacement,
  saveSecondLane,
  groupByZone,
  placementFromGroups,
  isWidgetEnabled,
  isFullWidth,
} from 'utils/widgets';

import EventBus from 'utils/eventbus';

// The three zones, in the order they are drawn around the preview.
const ZONE_TITLES = { left: 'Left', center: 'Centre', right: 'Right' };

// How long a card has to be held over another one in the middle column before
// that one steps aside. Short enough to feel like a deliberate gesture, long
// enough that dragging past a row on the way somewhere else never triggers it.
const HOLD_MS = 260;

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

const SortableItem = ({ id, enabled, onToggle, secondColumn, makingRoom }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = { transform: CSS.Transform.toString(transform), transition };

  const className = [
    'sortableItem',
    secondColumn ? 'inSecondColumn' : '',
    makingRoom ? 'makingRoom' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <li ref={setNodeRef} style={style} {...attributes} className={className} data-widget-id={id}>
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
const Zone = ({ zone, items, onToggle, isEnabled, secondLane, makingRoomId, hovered }) => {
  const { setNodeRef, isOver } = useDroppable({ id: zone });
  const className = `widgetZone${isOver || hovered ? ' widgetZoneOver' : ''}`;

  return (
    <div ref={setNodeRef} className={className} data-zone={zone}>
      <span className="title">{ZONE_TITLES[zone]}</span>
      <SortableContext id={zone} items={items} strategy={verticalListSortingStrategy}>
        <ul className="sortableContainer">
          {items.length === 0 ? <li className="widgetZoneEmpty">Drop a widget here</li> : null}
          {items.map((id) => (
            <SortableItem
              key={id}
              id={id}
              enabled={isEnabled(id)}
              onToggle={onToggle}
              secondColumn={zone === 'center' && secondLane.includes(id)}
              makingRoom={zone === 'center' && makingRoomId === id}
            />
          ))}
        </ul>
      </SortableContext>
    </div>
  );
};

const Overview = () => {
  const [groups, setGroups] = useState(() => groupByZone(readOrder(), readPlacement()));
  const [secondLane, setSecondLane] = useState(readSecondLane);
  // The card that has been held over long enough to step aside, and the drag
  // handler that is waiting for it.
  const [steppedAside, setSteppedAside] = useState(null);
  // The column a card is being dragged over, so the box it will land in says so
  // without the lists having to move anything mid-gesture.
  const [hoverZone, setHoverZone] = useState(null);
  const holdRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const findZone = useCallback((id) => ZONES.find((zone) => groups[zone].includes(id)), [groups]);

  const zoneFor = (over) => {
    if (!over) return null;

    return ZONES.includes(over.id) ? over.id : findZone(over.id);
  };

  const clearHold = useCallback(() => {
    if (holdRef.current) {
      clearTimeout(holdRef.current.timer);
      holdRef.current = null;
    }

    setSteppedAside(null);
  }, []);

  /**
   * A card held over another one in the middle column asks it to step aside.
   * The timer is per target, so moving along the list never fires a card that
   * was only passed over.
   */
  const holdOver = useCallback((id) => {
    if (holdRef.current?.id === id) return;

    if (holdRef.current) clearTimeout(holdRef.current.timer);

    if (!id) {
      holdRef.current = null;
      setSteppedAside(null);

      return;
    }

    holdRef.current = {
      id,
      timer: setTimeout(() => {
        holdRef.current = null;
        setSteppedAside(id);
      }, HOLD_MS),
    };
  }, []);

  /**
   * Nothing moves between the lists while a card is in the air. Moving a row to
   * another container unmounts the element dnd-kit is dragging, which ends the
   * gesture on the spot: the card stops at the border of the list it came from
   * and drops back into it. So the drag only lights up the column it is over,
   * and the move itself happens once, on the drop.
   */
  const handleDragOver = ({ active, over }) => {
    const from = findZone(active.id);
    const to = zoneFor(over);

    const overCentreRow =
      Boolean(over) &&
      !ZONES.includes(over.id) &&
      over.id !== active.id &&
      from === 'center' &&
      to === 'center' &&
      // Only a card has a second column to move into; the clock and the like
      // read across the whole middle and stay put.
      !isFullWidth(over.id) &&
      !isFullWidth(active.id);

    holdOver(overCentreRow ? over.id : null);
    setHoverZone(to && to !== from ? to : null);
  };

  /**
   * Which row the dragged card was left over. `over` is usually a row, but the
   * container itself is a drop target too, and then there is no row to take an
   * index from: the card's own centre answers instead.
   */
  const dropIndex = (zone, ids, active, over) => {
    if (over && ids.includes(over.id)) return ids.indexOf(over.id);

    const dragged = active.rect?.current?.translated;

    if (!dragged) return -1;

    const centre = dragged.top + dragged.height / 2;
    // The dragged card follows the pointer, so it is the nearest row to itself
    // whenever the pointer has not left the row it came from — which resolves to
    // its own index and leaves the list alone, exactly what a drop that barely
    // moved should do. In another column it is not in the list at all and the
    // row it was dropped over answers instead.
    const rows = [...document.querySelectorAll(`.widgetZone[data-zone="${zone}"] .sortableItem`)];

    let best = -1;
    let nearest = Infinity;

    rows.forEach((row) => {
      const index = ids.indexOf(row.dataset.widgetId);

      if (index < 0) return;

      const box = row.getBoundingClientRect();
      const distance = Math.abs(box.top + box.height / 2 - centre);

      if (distance < nearest) {
        nearest = distance;
        best = index;
      }
    });

    return best;
  };

  /**
   * The card joins the column of the card it was dropped beside, which is how
   * both columns grow; dropped anywhere else in the middle it goes to the first.
   */
  const laneFor = (id, over) => {
    const beside = over && groups.center.includes(over.id) && over.id !== id ? over.id : null;

    return beside && secondLane.includes(beside) ? [...lane(), id] : lane();
  };

  const lane = (id) => secondLane.filter((item) => item !== id);

  const handleDragEnd = ({ active, over }) => {
    const aside = steppedAside;

    clearHold();
    setHoverZone(null);

    const from = findZone(active.id);
    const to = zoneFor(over);

    if (!from || !to) return;

    if (to !== 'center') {
      // Leaving the middle column means leaving its second column as well.
      setSecondLane(lane(active.id));
    } else if (aside && aside !== active.id) {
      // Dropped into the space the held card opened: the dragged card takes
      // that place in the first column and the other one keeps the second.
      setSecondLane([...lane(active.id).filter((id) => id !== aside), aside]);

      setGroups((previous) => {
        const rest = previous.center.filter((id) => id !== active.id);
        const at = rest.indexOf(aside);

        return {
          ...previous,
          center:
            at < 0 ? [...rest, active.id] : [...rest.slice(0, at), active.id, ...rest.slice(at)],
        };
      });

      return;
    } else if (from === 'center' || to === 'center') {
      setSecondLane(laneFor(active.id, over));
    }

    const target = dropIndex(to, groups[to], active, over);

    if (from === to) {
      const current = groups[from].indexOf(active.id);

      if (target < 0 || target === current) return;

      setGroups((previous) => ({
        ...previous,
        [from]: arrayMove(previous[from], current, target),
      }));

      return;
    }

    setGroups((previous) => {
      const next = {
        left: [...previous.left],
        center: [...previous.center],
        right: [...previous.right],
      };

      next[from] = next[from].filter((id) => id !== active.id);

      const at = target < 0 || target > next[to].length ? next[to].length : target;

      next[to].splice(at, 0, active.id);

      return next;
    });
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

  // Every drop writes the layout the page reads: the order, the zone each
  // widget sits in, and the middle column's second lane.
  useEffect(() => {
    saveOrder([...groups.left, ...groups.center, ...groups.right]);
    savePlacement(placementFromGroups(groups));
    saveSecondLane(secondLane.filter((id) => groups.center.includes(id) && !isFullWidth(id)));
    variables.stats.postEvent('setting', 'Widget placement');
    EventBus.emit('refresh', 'widgets');
  }, [groups, secondLane]);

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

  // `wide` is for the four lines that read across the middle column: they are
  // two cards wide in the page and so two cards wide here.
  const previewCard = ({ id, node }, wide = false) => (
    <div className={`previewItem${wide ? ' previewItem-wide' : ''}`} key={`preview-${id}`}>
      {node}
    </div>
  );

  const previewItems = (zone) =>
    groups[zone]
      .filter((id) => isWidgetEnabled(id))
      .map((id) => ({ id, node: previewItem(id) }))
      .filter(({ node }) => node !== null);

  const previewZone = (zone) => {
    const items = previewItems(zone);

    // The middle column is drawn as one column until something sits in the
    // second one — or until a card is being held aside, which shows the result
    // before the drop.
    const aside = steppedAside && items.some(({ id }) => id === steppedAside) ? steppedAside : null;

    if (zone !== 'center' || (!aside && secondLane.length === 0)) {
      return (
        <div className={`previewZone previewZone-${zone}`}>
          {items.map((item) => previewCard(item, isFullWidth(item.id)))}
        </div>
      );
    }

    const inSecond = (id) => (aside ? id === aside : secondLane.includes(id));
    const lines = items.filter(({ id }) => isFullWidth(id));
    const first = items.filter(({ id }) => !isFullWidth(id) && !inSecond(id));
    const second = items.filter(({ id }) => !isFullWidth(id) && inSecond(id));

    return (
      <div className={`previewZone previewZone-${zone}`}>
        {lines.map((item) => previewCard(item, true))}
        <div className="previewLanes">
          <div className="previewLane">
            {first.map(({ id, node }) => previewCard({ id, node }))}
          </div>
          <div className="previewLane">
            {second.map(({ id, node }) => previewCard({ id, node }))}
          </div>
        </div>
      </div>
    );
  };

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
        onDragCancel={clearHold}
      >
        <div className="overviewZones">
          <div className="overviewSide overviewSide-left">
            <Zone
              zone="left"
              items={groups.left}
              onToggle={toggleEnabled}
              isEnabled={isWidgetEnabled}
              secondLane={secondLane}
              hovered={hoverZone === 'left'}
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
              secondLane={secondLane}
              hovered={hoverZone === 'right'}
            />
          </div>

          <div className="overviewBelow">
            <Zone
              zone="center"
              items={groups.center}
              onToggle={toggleEnabled}
              isEnabled={isWidgetEnabled}
              secondLane={secondLane}
              makingRoomId={steppedAside}
              hovered={hoverZone === 'center'}
            />
          </div>
        </div>
      </DndContext>
    </>
  );
};

export { Overview as default, Overview };
