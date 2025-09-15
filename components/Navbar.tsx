import React from 'react';

interface NavbarProps {
  isMuted: boolean;
  onMuteToggle: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ isMuted, onMuteToggle }) => {
  return (
    <nav className="bg-slate-950/50 backdrop-blur-sm p-4 shadow-lg border-b border-slate-700 fixed top-0 w-full z-10">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <i className="fas fa-dungeon text-3xl text-amber-400"></i>
          <h1 className="text-xl md:text-2xl font-bold text-gray-100 tracking-wider font-serif">
            Adventa- A Text Roguelike Adventure
          </h1>
        </div>
        <div className="flex items-center space-x-4">
            <button 
              onClick={onMuteToggle} 
              title={isMuted ? "Unmute" : "Mute"} 
              className="text-xl text-slate-400 hover:text-white transition-colors w-8 h-8 flex items-center justify-center"
              aria-label={isMuted ? "Unmute audio" : "Mute audio"}
            >
                <i className={`fas ${isMuted ? 'fa-volume-xmark' : 'fa-volume-high'}`}></i>
            </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
