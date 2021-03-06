import React, { CSSProperties, MouseEvent, useState } from "react";
import { Rect } from "./rect";
import { HotKeys } from "react-hotkeys";
import { Data } from "./data";
import { Cursor } from "./cursor";

type LastDrag = { x: number; y: number };

export function Designer({ data }: { data: Data }) {
  const ids = data.useShapeIDs();
  console.log({ ids });

  const overID = data.useOverShapeID();
  console.log({ overID });

  const collaboratorIDs = data.useCollaboratorIDs(data.clientID);
  console.log({ collaboratorIDs });

  // TODO: This should be stored in Replicache too, since we will be rendering
  // other users' selections.
  const [selectedID, setSelectedID] = useState("");
  const [lastDrag, setLastDrag] = useState<LastDrag | null>(null);

  const onMouseDown = (e: MouseEvent, id: string) => {
    setSelectedID(id);
    updateLastDrag(e);
  };

  const onMouseMove = (e: MouseEvent) => {
    data.setCursor({
      id: data.clientID,
      x: e.nativeEvent.offsetX,
      y: e.nativeEvent.offsetY,
    });

    if (lastDrag === null) {
      return;
    }
    // This is subtle, and worth drawing attention to:
    // In order to properly resolve conflicts, what we want to capture in
    // mutation arguments is the *intent* of the mutation, not the effect.
    // In this case, the intent is the amount the mouse was moved by, locally.
    // We will apply this movement to whatever the state happens to be when we
    // replay. If somebody else was moving the object at the same moment, we'll
    // then end up with a union of the two vectors, which is what we want!
    data.moveShape({
      id: selectedID,
      dx: e.clientX - lastDrag.x,
      dy: e.clientY - lastDrag.y,
    });
    updateLastDrag(e);
  };

  const onMouseUp = (e: MouseEvent) => {
    setLastDrag(null);
  };

  const updateLastDrag = (e: MouseEvent) => {
    setLastDrag({ x: e.clientX, y: e.clientY });
  };

  const handlers = {
    moveLeft: () => data.moveShape({ id: selectedID, dx: -20, dy: 0 }),
    moveRight: () => data.moveShape({ id: selectedID, dx: 20, dy: 0 }),
    moveUp: () => data.moveShape({ id: selectedID, dx: 0, dy: -20 }),
    moveDown: () => data.moveShape({ id: selectedID, dx: 0, dy: 20 }),
  };

  return (
    <HotKeys {...{ keyMap, style: styles.keyboardManager, handlers }}>
      <div
        {...{
          className: "container",
          style: styles.container,
          onMouseMove,
          onMouseUp,
        }}
      >
        <svg width="100%" height="100%">
          {ids.map((id) => (
            // shapes
            <Rect
              {...{
                key: id,
                data,
                id,
                onMouseEnter: () =>
                  data.overShape({ clientID: data.clientID, shapeID: id }),
                onMouseLeave: () =>
                  data.overShape({ clientID: data.clientID, shapeID: "" }),
                onMouseDown: (e) => onMouseDown(e, id),
              }}
              highlight={false}
            />
          ))}

          {
            // self highlight
            overID && (
              <Rect
                {...{
                  key: `highlight-${overID}`,
                  data,
                  id: overID,
                  highlight: true,
                }}
              />
            )
          }
        </svg>

        {collaboratorIDs.map((id) => (
          // collaborator cursors
          <Cursor
            {...{
              key: `key-${id}`,
              data,
              clientID: id,
            }}
          />
        ))}
      </div>
    </HotKeys>
  );
}

const keyMap = {
  moveLeft: ["left", "shift+left"],
  moveRight: ["right", "shift+right"],
  moveUp: ["up", "shift+up"],
  moveDown: ["down", "shift+down"],
};

const styles = {
  container: {
    position: "relative",
    width: "100%",
    height: "100%",
  } as CSSProperties,
  keyboardManager: {
    outline: "none",
    width: "100%",
    height: "100%",
  },
};
