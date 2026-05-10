'use client';

import Select from '@/components/ui/animated-select';

const modelOptions = [
  {
    id: '1',
    label: 'GPT-4o',
    value: 'gpt-4o',
    description: 'Most capable model for complex tasks',
    icon: '🤖',
  },
  {
    id: '2',
    label: 'Claude 3.5',
    value: 'claude-3.5',
    description: 'Best for creative writing and analysis',
    icon: '🎨',
  },
  {
    id: '3',
    label: 'Gemini Pro',
    value: 'gemini-pro',
    description: 'Google latest multimodal model',
    icon: '✨',
  },
  {
    id: '4',
    label: 'Llama 3',
    value: 'llama-3',
    description: 'Open-source high-performance LLM',
    icon: '🦙',
  },
];

export default function AnimatedSelectDemo() {
  return <Select data={modelOptions} defaultValue="gpt-4o" />;
}
