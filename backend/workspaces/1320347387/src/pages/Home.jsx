import React from 'react'

import Navbar from '../Components/common/Navbar'
import Hero from '../Components/home/Hero'
import Footer from '../Components/common/Footer'


const Home = () => {
  return (
    <div className=' min-h-screen w-full'>

        <Navbar />
       
    
        <Hero />
        
        <Footer />

    </div>
  )
}

export default Home