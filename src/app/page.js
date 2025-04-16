'use client'

import { useState, useEffect } from 'react'
import './page.css'
import Image from "next/image";

export default function Home() {
  const [selectedShapes, setSelectedShapes] = useState([]);
  const [activeColumn, setActiveColumn] = useState(1);
  const [isManualMode, setIsManualMode] = useState(true);
  const [selectedSubShapes, setSelectedSubShapes] = useState([null, null, null]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      const key = e.key.toLowerCase();

      // Escape tuşu ile tüm seçimleri sıfırla
      if (key === 'escape') {
        setSelectedShapes([]);
        setSelectedSubShapes([null, null, null]);
        setActiveColumn(1);
        return;
      }

      // Eğer üç seçim tamamlandıysa ve ESC ile resetlenmediyse, kısayolları devre dışı bırak
      if (selectedShapes.length === 3 && selectedShapes.every(shape => shape !== null)) {
        return;
      }

      let shape = null;

      // Şekil seçimi için klavye kısayolları
      if (key === 's' || key === 'k') {
        shape = 'square';
      } else if (key === 't' || key === 'ü') {
        shape = 'triangle';
      } else if (key === 'c' || key === 'y') {
        shape = 'circle';
      }

      // Sütun seçimi için sayı tuşları
      if (['1', '2', '3'].includes(key)) {
        setActiveColumn(parseInt(key));
      }

      // Eğer geçerli bir şekil seçildiyse ve aktif sütun varsa
      if (shape && activeColumn) {
        handleShapeSelect(shape, activeColumn);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [activeColumn, selectedShapes]);

  const handleShapeSelect = (shape, column) => {
    let newSelectedShapes = [...selectedShapes];
    
    // Eğer array 3 elemandan kısa ise, null değerlerle doldur
    while (newSelectedShapes.length < 3) {
      newSelectedShapes.push(null);
    }

    // Eğer şekil zaten başka bir sütunda seçiliyse, o seçimi kaldır
    const existingIndex = newSelectedShapes.indexOf(shape);
    if (existingIndex !== -1) {
      newSelectedShapes[existingIndex] = null;
    }

    // Yeni şekli seç
    newSelectedShapes[column - 1] = shape;

    // Eğer iki şekil seçiliyse, üçüncü şekli otomatik seç
    const selectedCount = newSelectedShapes.filter(Boolean).length;
    if (selectedCount === 2) {
      const allShapes = ['circle', 'square', 'triangle'];
      const remainingShape = allShapes.find(shape => !newSelectedShapes.includes(shape));
      const emptyColumnIndex = newSelectedShapes.findIndex(shape => shape === null);
      if (emptyColumnIndex !== -1 && remainingShape) {
        newSelectedShapes[emptyColumnIndex] = remainingShape;
      }
    }

    setSelectedShapes(newSelectedShapes);

    // Bir sonraki boş sütunu bul ve aktif sütunu güncelle
    const nextEmptyColumn = newSelectedShapes.findIndex((shape, index) => shape === null) + 1;
    if (nextEmptyColumn > 0 && nextEmptyColumn <= 3) {
      setActiveColumn(nextEmptyColumn);
    }

    // Eğer 3 şekil seçildiyse ve simulator modundaysak
    if (newSelectedShapes.every(shape => shape !== null) && !isManualMode) {
      console.log('Alt şekiller oluşturuluyor...');
      console.log('Ana şekiller:', newSelectedShapes);
      
      let subShapes = [];
      let previousSubShapes = selectedSubShapes;
      let isSameAsPrevious = true;
      
      // Aynı sıralama olmayana kadar döngü
      while (isSameAsPrevious) {
        // Alt şekilleri oluştur
        subShapes = [];
        
        // Her sütun için alt şekilleri belirle
        newSelectedShapes.forEach((mainShape, index) => {
          // İlk alt şekil her zaman ana şekil olacak
          subShapes[index * 2] = mainShape;
        });

        // Tüm şekilleri bir listeye al ve shuffle et
        let availableShapes = [...newSelectedShapes];
        availableShapes = availableShapes.sort(() => Math.random() - 0.5);

        console.log('Shuffled şekiller:', availableShapes);

        // Her sütun için ikinci alt şekli belirle
        newSelectedShapes.forEach((_, index) => {
          // İkinci alt şekil için shuffled listesinden ilk öğeyi al
          subShapes[index * 2 + 1] = availableShapes[0];
          // Kullanılan şekli listeden çıkar
          availableShapes = availableShapes.slice(1);
        });

        // Önceki sıralama ile aynı mı kontrol et
        isSameAsPrevious = subShapes.every((shape, index) => shape === previousSubShapes[index]);
        
        if (isSameAsPrevious) {
          console.log('Aynı sıralama üretildi, tekrar deneniyor...');
        }
      }

      console.log('Final alt şekiller:', subShapes);

      // Alt şekilleri güncelle
      setSelectedSubShapes(subShapes);
    }
  };

  const handleSubShapeSelect = (shape, index) => {
    let newSelectedSubShapes = [...selectedSubShapes];
    newSelectedSubShapes[index] = shape;
    setSelectedSubShapes(newSelectedSubShapes);
  };

  const resetPuzzle = () => {
    setSelectedShapes([]);
    setSelectedSubShapes([null, null, null]);
  };

  const getAvailableShapes = (column) => {
    return ["circle", "square", "triangle"];
  };

  const getButtonClassName = (shape, column) => {
    let className = `shapeButton ${shape}`;
    if (isShapeSelected(shape, column)) {
      className += ' selected';
    }
    if (isShapeSelectedInOtherColumn(shape, column)) {
      className += ' dimmed';
    }
    return className;
  };

  const isShapeSelected = (shape, column) => {
    return selectedShapes.includes(shape);
  };

  const isShapeSelectedInOtherColumn = (shape, column) => {
    return selectedShapes.includes(shape) && selectedShapes.indexOf(shape) !== column - 1;
  };

  return (
    <div className="page">
      <main className="main">
        <h1 className="title">Verity Simulator</h1>
        
        <div className="modeToggle">
          <button 
            className={`toggleButton ${isManualMode ? 'active' : ''}`}
            onClick={() => setIsManualMode(true)}
          >
            Manual Mode
          </button>
          <button 
            className={`toggleButton ${!isManualMode ? 'active' : ''}`}
            onClick={() => setIsManualMode(false)}
          >
            Simulator Mode
          </button>
        </div>

        <div className="container">
          <h3 className="sectionTitle">Shape Order</h3>
          <div className="columns startingShapes">
            {[1, 2, 3].map((column) => (
              <div 
                key={column} 
                className={`column ${activeColumn === column && !(selectedShapes.length === 3 && selectedShapes.every(Boolean)) ? 'active' : ''}`}
              >
                <h3 className="columnTitle">Player {column}</h3>
                <div className="shapeButtons">
                  {['circle', 'triangle', 'square'].map((shape) => (
                    <button
                      key={shape}
                      className={getButtonClassName(shape, column)}
                      onClick={() => handleShapeSelect(shape, column)}
                    >
                      <div className={shape} />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {selectedShapes.length === 3 && selectedShapes.every(shape => shape !== null) && (
            <>
              <h3 className="sectionTitle">Starting Shapes</h3>
              <div className="columns">
                {selectedShapes.map((mainShape, index) => (
                  <div key={index} className="column">
                    <div className={`mainShape ${mainShape}`} />
                    <div className="subShapes">
                      <div className={`subShape ${mainShape}`} />
                      {isManualMode ? (
                        <div className="subShapeButtons">
                          {['circle', 'triangle', 'square'].map((shape) => (
                            <button
                              key={shape}
                              className={`subShapeButton ${shape} ${selectedSubShapes[index] === shape ? 'selected' : ''}`}
                              onClick={() => handleSubShapeSelect(shape, index)}
                            >
                              <div className={shape} />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className={`subShape ${selectedSubShapes[index * 2 + 1]}`} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <button className="button" onClick={resetPuzzle}>
          Reset Puzzle
        </button>
      </main>
      <footer className="footer">
        <a
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
