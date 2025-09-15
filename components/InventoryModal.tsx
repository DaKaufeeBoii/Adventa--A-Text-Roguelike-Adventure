import React from 'react';
import { InventoryItem } from '../types';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryItem[];
  onItemHover: (item: InventoryItem | null) => void;
  activeItem: InventoryItem | null;
  itemHint: string | null;
  isHintLoading: boolean;
}

const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  onClose,
  inventory,
  onItemHover,
  activeItem,
  itemHint,
  isHintLoading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col md:flex-row" 
        onClick={e => e.stopPropagation()}
        onMouseLeave={() => onItemHover(null)}
      >
        {/* Item Grid */}
        <div className="p-6 flex-grow md:w-2/3 md:border-r md:border-slate-700 overflow-hidden flex flex-col">
            <header className="flex justify-between items-center mb-4 flex-shrink-0">
                <h2 className="text-2xl font-bold text-amber-400 font-serif">Inventory</h2>
                <button onClick={onClose} className="text-slate-400 hover:text-white text-3xl font-light">&times;</button>
            </header>
            <div className="overflow-y-auto flex-grow custom-scrollbar pr-2 -mr-2">
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-4">
                {inventory.map((item, index) => (
                  <div 
                      key={index} 
                      className="aspect-square bg-slate-800 rounded-lg border-2 border-slate-600 hover:border-amber-400 transition-all p-1 cursor-pointer"
                      onMouseEnter={() => onItemHover(item)}
                      title={item.name}
                  >
                    {item.iconUrl ? (
                      <img src={item.iconUrl} alt={item.name} className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-500"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
        </div>

        {/* Item Details Pane */}
        <div className="p-6 md:w-1/3 flex flex-col flex-shrink-0 bg-slate-900/50 md:bg-transparent">
          {activeItem ? (
            <div className="animate-fade-in">
              <h3 className="text-xl font-bold text-amber-300 font-serif">{activeItem.name}</h3>
              <p className="text-slate-400 italic mt-2 mb-4">{activeItem.description}</p>
              <div className="border-t border-slate-600 pt-4">
                <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Usefulness</h4>
                {isHintLoading ? (
                  <p className="text-slate-500 mt-2 italic">Considering possibilities...</p>
                ) : (
                  <p className="text-slate-300 mt-2">{itemHint}</p>
                )}
              </div>
            </div>
          ) : (
             <div className="text-center text-slate-500 m-auto">
                <i className="fas fa-eye text-4xl mb-3"></i>
                <p>Hover over an item to inspect it.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryModal;