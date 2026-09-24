import { useState, useEffect } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Skills from "./components/Skills";
import Projects from "./components/Projects";
import Experience from "./components/Experience";
import Contact from "./components/Contact";
import Footer from "./components/footer";
import FloatingWidget from "./components/FloatingWidget";

function App() {
  const [currentLang, setCurrentLang] = useState("EN");
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    document.documentElement.dir = currentLang === "AR" ? "rtl" : "ltr";
    document.documentElement.lang = currentLang.toLowerCase();
  }, [currentLang]);

  return (
    <div className={`${isDark ? "bg-[#07090F] text-white" : "bg-white text-slate-900"} min-h-screen transition-colors duration-300`}>
      <Header 
        currentLang={currentLang} 
        setCurrentLang={setCurrentLang} 
        isDark={isDark} 
        setIsDark={setIsDark} 
      />

      <main>
        <Hero lang={currentLang} isDark={isDark} />
        <Skills lang={currentLang} isDark={isDark} />
        <Projects lang={currentLang} isDark={isDark} />
        <Experience lang={currentLang} isDark={isDark} />
        <Contact lang={currentLang} isDark={isDark} />
      </main>

      <FloatingWidget lang={currentLang} isDark={isDark} />
      <Footer lang={currentLang} isDark={isDark} />
    </div>
  );
}

export default App;