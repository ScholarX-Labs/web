import { AnimatedText } from "@/components/ui/animated-text"

function DefaultDemo() {
  return <AnimatedText text="Mishra Hub" />
}

function CustomStyleDemo() {
  return (
    <AnimatedText 
      text="Custom Style"
      textClassName="text-6xl text-gradient-to-r from-blue-600 to-purple-600"
      underlineGradient="from-red-500 via-yellow-500 to-green-500"
      underlineHeight="h-2"
      underlineOffset="-bottom-4"
    />
  )
}

function HeadingDemo() {
  return (
    <AnimatedText 
      text="As H2 Element"
      as="h2"
      textClassName="text-2xl"
      underlineClassName="rounded-full"
    />
  )
}

function SlowAnimationDemo() {
  return (
    <AnimatedText 
      text="Slower Animation"
      duration={0.8}
      delay={0.2}
    />
  )
}

export {
  DefaultDemo,
  CustomStyleDemo,
  HeadingDemo,
  SlowAnimationDemo
}
