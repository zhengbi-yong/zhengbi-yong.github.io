'use client';

import TiptapEditor from './TiptapEditor';

export default function CollaborationEditor({ 
  roomId,
  ...props 
}: { 
  roomId: string;
} & React.ComponentProps<typeof TiptapEditor>) {
  return (
    <div data-collab-room={roomId}>
      <TiptapEditor 
        collaborationRoomId={roomId}
        {...props}
      />
    </div>
  );
}
