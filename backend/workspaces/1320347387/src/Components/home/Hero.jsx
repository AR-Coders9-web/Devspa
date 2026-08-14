import React from 'react'
import AnimatedBackground from './AnimatedBackground'
import HeroDashboard from './HeroDashbord'
import Welcome from './Welcome'
import HeroStats from './HeroStats'
import Infinite from './Infinite'
import Infinite2 from './Infinite2'


const Hero = () => {
  return (
    <div className='relative min-h-screen overflow-hidden flex justify-center items-center flex-col '>
      <AnimatedBackground />

      <div className=' mt-20 w-full flex justify-center items-center flex-col' >

        <Welcome />

        <div className='w-full md:w-[90%] lg:w-[80%] mx-auto '>

        <HeroDashboard />

        </div>


      </div >

   

      <Infinite />
      <Infinite2 />
    </div>
  )
}

export default Hero