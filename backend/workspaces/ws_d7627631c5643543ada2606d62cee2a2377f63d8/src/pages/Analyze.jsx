import React from 'react'
import AnalyzeWorkspace from '../Components/analyze/AnalyzeWorkspace'
import Navbar from '../Components/common/Navbar'




const Analyze = () => {
  return (
    <div className='min-h-screen  bg-[#030712]' >
      <Navbar />
      <div className=" pt-35 mx-auto w-[92%] max-w-7xl pt-10">

        <AnalyzeWorkspace />

      </div>


    </div>
  )
}

export default Analyze