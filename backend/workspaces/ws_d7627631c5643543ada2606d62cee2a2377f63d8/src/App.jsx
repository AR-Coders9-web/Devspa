import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Analyze from "./pages/Analyze";
import Result from "./pages/Result";
import NotFound from "./pages/NotFound";
import useSmoothScroll from "./hooks/SmoothScroll";
import HowItWorks from "./Components/home/HowItWorks";
import ScrollProgress from "./Components/common/ScrollProgress";




function App() {

useSmoothScroll();

  return (
<div>

    <ScrollProgress />
      <Routes>

        <Route path="/" element={<Home />} />

        <Route path="/analyze" element={<Analyze />} />

        <Route path="/result" element={<Result />} />

        <Route path="*" element={<NotFound />} />

        <Route path="/how-it-works" element={<HowItWorks />} />


      </Routes>
</div>
    
  );
}

export default App;