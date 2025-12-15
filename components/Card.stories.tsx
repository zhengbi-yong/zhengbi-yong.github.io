import type { Meta, StoryObj } from '@storybook/react'
import Card from './Card'

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: 'Card component for displaying content with hover effects',
    },
  },
  argTypes: {
    title: {
      control: { type: 'text' },
      description: 'Card title',
    },
    description: {
      control: { type: 'text' },
      description: 'Card description',
    },
    img: {
      control: { type: 'text' },
      description: 'Image URL',
    },
    imgAlt: {
      control: { type: 'text' },
      description: 'Image alt text',
    },
    href: {
      control: { type: 'text' },
      description: 'Link URL',
    },
    showTags: {
      control: { type: 'boolean' },
      description: 'Show or hide tags',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Default card
export const Default: Story = {
  args: {
    title: 'Sample Card',
    description: 'This is a sample card with description and some additional content to showcase the card layout.',
    img: 'https://picsum.photos/400/300',
    imgAlt: 'Sample image',
    showTags: true,
  },
}

// Card without image
export const WithoutImage: Story = {
  args: {
    title: 'Text Only Card',
    description: 'This card has no image, just text content.',
    showTags: false,
  },
}

// Interactive card with link
export const InteractiveCard: Story = {
  args: {
    title: 'Interactive Card',
    description: 'Click this card to navigate to another page.',
    href: '/blog',
    img: 'https://picsum.photos/400/300?random=1',
    imgAlt: 'Interactive card image',
    showTags: true,
  },
}

// Minimal card
export const Minimal: Story = {
  args: {
    title: 'Minimal Card',
    description: 'Simple and clean card design.',
    showTags: false,
  },
}