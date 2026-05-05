'use client';

import BlockNoteEditor from './BlockNoteEditor';

export default function CollaborationEditor({ 
  roomId,
  ...props 
}: { 
  roomId: string;
} & React.ComponentProps<typeof BlockNoteEditor>) {
  return (
    <div data-collab-room={roomId}>
      <BlockNoteEditor 
        {...props}
      />
    </div>
  );
}
