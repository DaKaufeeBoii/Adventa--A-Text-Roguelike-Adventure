
import React from 'react';

const Navbar: React.FC = () => {
  return (
    <nav className="bg-slate-950/50 backdrop-blur-sm p-4 shadow-lg border-b border-slate-700 fixed top-0 w-full z-10">
      <div className="container mx-auto flex items-center">
        <div className="flex items-center space-x-3">
          <i className="fas fa-dungeon text-3xl text-amber-400"></i>
          <h1 className="text-2xl font-bold text-gray-100 tracking-wider font-serif">
            Adventa- A Text Roguelike Adventure
          </h1>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
