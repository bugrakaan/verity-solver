'use client'

import { useState, useEffect } from 'react'
import './page.scss'
import Image from "next/image";
import CustomDropdown from '@/components/CustomDropdown';

export default function Home() {
  const [selectedShapes, setSelectedShapes] = useState([]);
  const [activeColumn, setActiveColumn] = useState(1);
  const [activeSubShapeGroup, setActiveSubShapeGroup] = useState(0);
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [optionsMode, setOptionsMode] = useState('random');
  const [selectedSubShapes, setSelectedSubShapes] = useState([
    { mainShape: null, shapes: [null, null] },
    { mainShape: null, shapes: [null, null] },
    { mainShape: null, shapes: [null, null] }
  ]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [currentShapes, setCurrentShapes] = useState([[null, null], [null, null], [null, null]]);
  const [playerNames, setPlayerNames] = useState(['Player 1', 'Player 2', 'Player 3']);
  const [solutionSteps, setSolutionSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [guidanceMessage, setGuidanceMessage] = useState('Please select a shape for Player 1');
  const [isGuidanceSuccess, setIsGuidanceSuccess] = useState(false);
  const [selectedOption, setSelectedOption] = useState('option1');

  const options = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  useEffect(() => {
    // Set initial guidance message after playerNames is loaded
    if (playerNames[0]) {
      setGuidanceMessage(`Please select a shape for ${playerNames[0]}`);
    }
  }, [playerNames]);

  useEffect(() => {
    const handleInputFocus = (e) => {
      const input = e.target;
      const column = parseInt(input.getAttribute('tabindex'));
      if (column) {
        setActiveColumn(column);
      }
    };

    const inputs = document.querySelectorAll('input[tabindex]');
    inputs.forEach(input => {
      input.addEventListener('focus', handleInputFocus);
    });

    return () => {
      inputs.forEach(input => {
        input.removeEventListener('focus', handleInputFocus);
      });
    };
  }, []);

  useEffect(() => {
    const handleKeyPress = (e) => {
      const key = e.key.toLowerCase();
      const code = e.code;

      // Eğer herhangi bir input veya düğme odaklanmışsa, klavye kısayollarını devre dışı bırak
      const activeElement = document.activeElement;
      if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'BUTTON') {
        // Eğer input focuslu ve Enter tuşuna basıldıysa, focusu kaldır
        if (activeElement.tagName === 'INPUT' && key === 'enter') {
          activeElement.blur();
          return;
        }
        return;
      }

      // Shift + 1-2-3 tuşları ile input'lara odaklan
      if (e.shiftKey && ['Digit1', 'Digit2', 'Digit3'].includes(code)) {
        const inputIndex = parseInt(code.replace('Digit', '')) - 1;
        const input = document.querySelector(`input[tabindex="${inputIndex + 1}"]`);
        if (input) {
          e.preventDefault();
          input.focus();
          input.select();
          return;
        }
      }

      // Space tuşuna basıldığında ve starting shapes seçimi bekleniyorsa, ilgili inputu focusla
      if (key === ' ') {
        // Eğer hiç şekil seçilmemişse veya bazı şekiller eksikse
        if (selectedShapes.length === 0 || selectedShapes.length < 3 || !selectedShapes.every(Boolean)) {
          const emptyGroupIndex = selectedShapes.findIndex(shape => !shape);
          const inputIndex = emptyGroupIndex === -1 ? 0 : emptyGroupIndex;
          const input = document.querySelector(`input[tabindex="${inputIndex + 1}"]`);
          if (input) {
            e.preventDefault(); // Space karakterinin yazılmasını engelle
            input.focus();
            input.select(); // Input içeriğini seç
            return;
          }
        }
      }

      // ESC tuşu ile seçimleri sıfırla
      if (key === 'escape') {
        // Starting Shapes'de değişiklik var mı kontrol et
        const hasStartingShapesChanges = selectedSubShapes.some(group => 
          group.mainShape !== null || group.shapes.some(shape => shape !== null)
        );

        if (hasStartingShapesChanges) {
          // Starting Shapes'i sıfırla
          setSelectedSubShapes([
            { mainShape: null, shapes: [null, null] },
            { mainShape: null, shapes: [null, null] },
            { mainShape: null, shapes: [null, null] }
          ]);
          setActiveSubShapeGroup(0);
        } else {
          // Shape Order'ı sıfırla
          setSelectedShapes([]);
          setActiveColumn(1);
        }
        updateGuidanceMessage();
        return;
      }

      // Eğer üç seçim tamamlandıysa ve ESC ile resetlenmediyse
      if (selectedShapes.length === 3 && selectedShapes.every(shape => shape !== null)) {
        // Live Mode'da ve Starting Shapes seçimi yapılıyorsa
        if (isLiveMode && selectedSubShapes.some(group => group.shapes[1] === null)) {
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
            const groupIndex = parseInt(key) - 1;
            if (selectedSubShapes[groupIndex].shapes[1] === null) {
              setActiveSubShapeGroup(groupIndex);
              return;
            }
          }

          // Eğer geçerli bir şekil seçildiyse ve aktif grup varsa
          if (shape && activeSubShapeGroup !== null) {
            // Seçilen şeklin daha önce kullanılıp kullanılmadığını kontrol et
            const isShapeUsed = selectedSubShapes.some(group => 
              group.shapes[1] === shape
            );
            
            if (!isShapeUsed) {
              handleSubShapeSelect(shape, activeSubShapeGroup * 2 + 1);
              
              // Bir sonraki boş grubu bul
              const nextEmptyGroup = selectedSubShapes.findIndex((group, index) => 
                index > activeSubShapeGroup && group.shapes[1] === null
              );
              if (nextEmptyGroup !== -1) {
                setActiveSubShapeGroup(nextEmptyGroup);
              } else {
                setActiveSubShapeGroup(0);
              }
            }
          }
          return;
        }
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
        updateGuidanceMessage();
      }

      // Eğer geçerli bir şekil seçildiyse ve aktif sütun varsa
      if (shape && activeColumn) {
        handleShapeSelect(shape, activeColumn);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [activeColumn, selectedShapes, isLiveMode, activeSubShapeGroup, selectedSubShapes]);

  useEffect(() => {
    updateGuidanceMessage();
  }, [selectedShapes, selectedSubShapes, isLiveMode, solutionSteps, currentStep, playerNames]);

  useEffect(() => {
    updateGuidanceMessage();
  }, [activeColumn]);

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
    updateGuidanceMessage();

    // Eğer tüm şekiller seçili değilse, subShapes'i sıfırla
    if (!newSelectedShapes.every(shape => shape !== null)) {
      setSelectedSubShapes([
        { mainShape: null, shapes: [null, null] },
        { mainShape: null, shapes: [null, null] },
        { mainShape: null, shapes: [null, null] }
      ]);
    }

    // Bir sonraki boş sütunu bul ve aktif sütunu güncelle
    const nextEmptyColumn = newSelectedShapes.findIndex((shape, index) => shape === null) + 1;
    if (nextEmptyColumn > 0 && nextEmptyColumn <= 3) {
      setActiveColumn(nextEmptyColumn);
    }

    // Eğer 3 şekil seçildiyse ve simulator modundaysak
    if (newSelectedShapes.every(shape => shape !== null) && !isLiveMode) {
      generateNewSubShapes(newSelectedShapes);
    }

    // Eğer 3 şekil seçildiyse ve Live Mode'daysak, mesajı güncelle
    if (newSelectedShapes.every(shape => shape !== null) && isLiveMode) {
      const emptyGroupIndex = selectedSubShapes.findIndex(group => 
        group.mainShape !== null && 
        group.shapes[1] === null
      );
      if (emptyGroupIndex !== -1) {
        setGuidanceMessage(`Please select a second shape for ${playerNames[emptyGroupIndex]}`);
      }
    }
  };

  const validateSubShapes = (subShapes) => {
    // 1. 3 farklı grup kontrolü
    if (subShapes.length !== 3) return false;

    // 2. Her grubun shapes arrayinin 2 değer içerdiği kontrolü
    if (!subShapes.every(group => group.shapes.length === 2)) return false;

    // 3. MainShape'lerin farklı olduğu kontrolü
    const mainShapes = subShapes.map(group => group.mainShape);
    if (new Set(mainShapes).size !== 3) return false;

    // 4. Toplam 6 şekil kontrolü
    const allShapes = subShapes.flatMap(group => group.shapes);
    if (allShapes.length !== 6) return false;

    // 5. Her şeklin 2'den az veya 2'den fazla tekrarlanmadığı kontrolü
    const shapeCounts = {};
    allShapes.forEach(shape => {
      shapeCounts[shape] = (shapeCounts[shape] || 0) + 1;
    });
    
    return Object.values(shapeCounts).every(count => count === 2);
  };

  const generateNewSubShapes = (mainShapes) => {
    console.log('Alt şekiller oluşturuluyor...');
    console.log('Ana şekiller:', mainShapes);
    
    let newSubShapes;
    let maxAttempts = 50; // Maksimum deneme sayısını artırdık
    let attempts = 0;
    let isValid = false;
    
    do {
      newSubShapes = selectedSubShapes.map((group, index) => ({
        mainShape: mainShapes[index],
        shapes: [mainShapes[index], null] // İlk shape her zaman mainShape olacak
      }));
      
      // Tüm şekilleri bir listeye al
      let availableShapes = [...mainShapes];
      
      if (optionsMode === 'noDouble') {
        // Her grup için ikinci shape'i rastgele seç, ama aynı shape'den olmasın
        mainShapes.forEach((_, index) => {
          const remainingShapes = availableShapes.filter(shape => shape !== newSubShapes[index].mainShape);
          const randomIndex = Math.floor(Math.random() * remainingShapes.length);
          newSubShapes[index].shapes[1] = remainingShapes[randomIndex];
        });
      } else if (optionsMode === 'oneDouble') {
        // Rastgele bir grup seç ve orada double olsun
        const doubleGroupIndex = Math.floor(Math.random() * 3);
        newSubShapes[doubleGroupIndex].shapes[1] = newSubShapes[doubleGroupIndex].mainShape;
        
        // Diğer iki grup için farklı shape'ler seç
        const otherGroups = [0, 1, 2].filter(i => i !== doubleGroupIndex);
        
        // İlk seçilen mainShape'i bul
        const firstMainShape = newSubShapes[doubleGroupIndex].mainShape;
        
        // Diğer iki grup için shape'leri belirle
        otherGroups.forEach((groupIndex, i) => {
          // Bu grubun mainShape'ini al
          const currentMainShape = newSubShapes[groupIndex].mainShape;
          
          // Kullanılabilir shape'leri bul (mainShape ve ilk seçilen mainShape hariç)
          const availableShapes = ['circle', 'triangle', 'square'].filter(shape => 
            shape !== currentMainShape && shape !== firstMainShape
          );
          
          // Kalan tek shape'i seç
          newSubShapes[groupIndex].shapes[1] = availableShapes[0];
        });
      } else if (optionsMode === 'threeDoubles') {
        // Tüm gruplarda ikinci shape mainShape ile aynı olsun
        newSubShapes.forEach(group => {
          group.shapes[1] = group.mainShape;
        });
      } else {
        // Random modu - her grupta ikinci shape rastgele seçilsin
        mainShapes.forEach((_, index) => {
          const randomIndex = Math.floor(Math.random() * availableShapes.length);
          newSubShapes[index].shapes[1] = availableShapes[randomIndex];
        });
      }

      attempts++;
      
      // Üretilen setin geçerli olup olmadığını kontrol et
      isValid = validateSubShapes(newSubShapes);
      
      // Eğer maksimum deneme sayısına ulaşıldıysa döngüyü kır
      if (attempts >= maxAttempts) {
        console.log('Maksimum deneme sayısına ulaşıldı, geçerli bir set bulunamadı');
        break;
      }
      
      // Yeni set geçerli ve mevcut setten farklıysa döngüyü kır
    } while (!isValid || JSON.stringify(newSubShapes) === JSON.stringify(selectedSubShapes));

    if (!isValid) {
      console.log('Geçerli bir set üretilemedi, mevcut set kullanılıyor');
      return;
    }

    console.log('Son alt şekiller:', newSubShapes);
    setSelectedSubShapes(newSubShapes);

    // Alt şekiller oluşturulduktan sonra simülasyonu başlat
    const steps = simulateSolution();
    setSolutionSteps(steps);
    if (steps.length > 0) {
      setCurrentStep(0);
      setCurrentShapes(steps[0].state);
    }
  };

  const handleSubShapeSelect = (shape, index) => {
    const groupIndex = Math.floor(index / 2);
    const shapeIndex = index % 2;
    
    const newSelectedSubShapes = [...selectedSubShapes];
    // Tüm grupların mainShape'lerini ve şekillerini güncelle
    newSelectedSubShapes.forEach((group, i) => {
      newSelectedSubShapes[i] = {
        ...group,
        mainShape: selectedShapes[i],
        shapes: [
          selectedShapes[i], // İlk şekil her zaman mainShape olacak
          i === groupIndex ? shape : group.shapes[1] // İkinci şekil seçilen grup için yeni şekil, diğerleri için mevcut şekil
        ]
      };
    });
    
    setSelectedSubShapes(newSelectedSubShapes);
    updateGuidanceMessage();

    // Bir sonraki boş grubu bul
    const nextEmptyGroup = selectedSubShapes.findIndex((group, index) => 
      index > groupIndex && group.shapes[1] === null
    );
    if (nextEmptyGroup !== -1) {
      setActiveSubShapeGroup(nextEmptyGroup);
    } else {
      setActiveSubShapeGroup(0);
    }

    console.log({
      newSelectedSubShapes
    });
    // Live Mode'da tüm şekiller seçildiğinde çözümü hesapla
    if (isLiveMode && newSelectedSubShapes.every(group => 
      group.mainShape !== null && 
      group.shapes.every(shape => shape !== null)
    )) {
      // Tüm subShape'ler seçildiğinde konsola log at
      console.log('All subShapes have been selected in Live Mode:');
      console.log('Current state:', newSelectedSubShapes);
      
      const steps = simulateSolution();
      setSolutionSteps(steps);
      if (steps.length > 0) {
        setCurrentStep(0);
        setCurrentShapes(steps[0].state);
        
        // Puzzle steps alanına otomatik kaydır
        setTimeout(() => {
          const puzzleStepsElement = document.querySelector('.puzzleSteps');
          if (puzzleStepsElement) {
            puzzleStepsElement.scrollIntoView({ behavior: 'smooth' });
          }
        }, 15);
      }
    }
  };

  // Kullanılabilir şekilleri hesapla
  const getAvailableShapes = (groupIndex) => {
    console.log('getAvailableShapes called for groupIndex:', groupIndex);
    console.log('Current selectedSubShapes:', selectedSubShapes);
    
    const usedShapes = new Set();
    selectedSubShapes.forEach((group, index) => {
      if (index !== groupIndex) {
        console.log(`Checking group ${index}:`, group);
        if (group.shapes[1]) {
          console.log(`Adding shape ${group.shapes[1]} to usedShapes`);
          usedShapes.add(group.shapes[1]);
        }
      }
    });

    console.log('Used shapes:', Array.from(usedShapes));
    const availableShapes = ['circle', 'triangle', 'square'].filter(shape => !usedShapes.has(shape));
    console.log('Available shapes:', availableShapes);
    
    // Eğer sadece bir seçenek kaldıysa ve bu grup henüz seçim yapmadıysa, otomatik seç
    if (availableShapes.length === 1 && selectedSubShapes[groupIndex].shapes[1] === null) {
      console.log('Only one shape available, auto-selecting:', availableShapes[0]);
      // Bir sonraki render döngüsünde otomatik seçim yap
      setTimeout(() => {
        handleSubShapeSelect(availableShapes[0], groupIndex * 2 + 1);
      }, 0);
    }
    
    return availableShapes;
  };

  // Alt şekiller değiştiğinde simülasyonu başlat
  useEffect(() => {
    // Tüm mainShape ve shapes değerlerinin dolu olduğunu kontrol et
    const allValuesFilled = selectedSubShapes.every(group => 
      group.mainShape !== null && 
      group.shapes.every(shape => shape !== null)
    );

    if (allValuesFilled) {
      console.log('All shapes are selected, starting simulation...');
      const steps = simulateSolution();
      setSolutionSteps(steps);
      if (steps.length > 0) {
        setCurrentStep(0);
        setCurrentShapes(steps[0].state);
      }
    }
  }, [selectedSubShapes]);

  // No Doubles değiştiğinde yeni şekiller oluştur
  useEffect(() => {
    if (!isLiveMode && selectedShapes.length === 3 && selectedShapes.every(shape => shape !== null)) {
      generateNewSubShapes(selectedShapes);
    }
  }, [optionsMode]);

  const resetPuzzle = () => {
    setSelectedShapes([]);
    setSelectedSubShapes([
      { mainShape: null, shapes: [null, null] },
      { mainShape: null, shapes: [null, null] },
      { mainShape: null, shapes: [null, null] }
    ]);
    setActiveColumn(1);
    updateGuidanceMessage();
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

  const handlePlayerNameChange = (index, newName) => {
    const newPlayerNames = [...playerNames];
    newPlayerNames[index] = newName;
    setPlayerNames(newPlayerNames);
    
    // Eğer ilk oyuncunun adı değiştiyse ve henüz şekil seçilmemişse, mesajı güncelle
    if (index === 0 && (!selectedShapes[0] || selectedShapes[0] === null)) {
      setGuidanceMessage(`Please select a shape for ${newName}`);
    }
  };

  const simulateSolution = () => {
    console.log('Starting solution simulation...');
    console.log('Initial state:', selectedSubShapes);


    const steps = [];
    let currentShapes = JSON.parse(JSON.stringify(selectedSubShapes));
    let stepNumber = 1;
    const MAX_ITERATIONS = 1000;

    // Nihai duruma ulaşana kadar döngü
    while (!isPuzzleSolved(currentShapes) && stepNumber <= MAX_ITERATIONS) {
      console.log(`\nStep ${stepNumber}:`);
      console.log('Current state:', currentShapes);

      // Bir sonraki hamleyi bul
      const nextMove = findNextMove(currentShapes);
      if (!nextMove) {
        console.log('No valid move found!');
        break;
      }

      // Hamleyi gerçekleştir
      const { fromPlayer, toPlayer, shape } = nextMove;
      
      // Şekli gönderen oyuncudan çıkar
      const fromPlayerShapes = currentShapes[fromPlayer].shapes;
      const shapeIndex = fromPlayerShapes.indexOf(shape);
      fromPlayerShapes.splice(shapeIndex, 1);

      // Şekli alıcı oyuncuya ekle
      currentShapes[toPlayer].shapes.push(shape);

      // Adımı kaydet
      const step = {
        step: stepNumber,
        fromPlayer,
        toPlayer,
        shape,
        state: JSON.parse(JSON.stringify(currentShapes))
      };
      steps.push(step);

      console.log(`Move: ${playerNames[fromPlayer]} sends ${shape} to ${playerNames[toPlayer]}`);
      console.log('New state:', currentShapes);

      stepNumber++;
    }

    if (stepNumber > MAX_ITERATIONS) {
      console.log('Maximum iteration limit reached!');
    }

    console.log('\nFinal state:', currentShapes);
    console.log('Solution steps:', steps);
    return steps;
  };

  const isPuzzleSolved = (shapes) => {
    // Her oyuncu için kontrol et
    return shapes.every((player, index) => {
      // Oyuncunun ana şeklini al
      const mainShape = player.mainShape;
      
      // Oyuncunun şekillerini kontrol et
      const playerShapes = player.shapes;
      
      // 1. Oyuncunun ana şekli elinde olmamalı
      if (playerShapes.includes(mainShape)) {
        return false;
      }
      
      // 2. Oyuncunun elinde tam olarak 2 farklı şekil olmalı
      if (playerShapes.length !== 2) {
        return false;
      }
      
      // 3. İki şekil birbirinden farklı olmalı
      if (playerShapes[0] === playerShapes[1]) {
        return false;
      }
      
      return true;
    });
  };

  const findNextMove = (shapes) => {
    // Her oyuncu için kontrol et
    for (let fromPlayer = 0; fromPlayer < shapes.length; fromPlayer++) {
      const fromPlayerShapes = shapes[fromPlayer].shapes;
      const fromPlayerMainShape = shapes[fromPlayer].mainShape;
      
      // Oyuncunun elindeki her şekli kontrol et
      for (const shape of fromPlayerShapes) {
        // Sadece oyuncunun ana şeklini gönderebilir
        if (shape !== fromPlayerMainShape) continue;
        
        // Her alıcı oyuncu için kontrol et
        for (let toPlayer = 0; toPlayer < shapes.length; toPlayer++) {
          // Kendine transfer yapamaz
          if (fromPlayer === toPlayer) continue;
          
          const toPlayerShapes = shapes[toPlayer].shapes;
          const toPlayerMainShape = shapes[toPlayer].mainShape;
          
          // Alıcı oyuncunun ana şekli bu şekilse transfer edemez
          if (shape === toPlayerMainShape) continue;
          
          // Alıcı oyuncunun elinde bu şekil yoksa transfer edebilir
          if (!toPlayerShapes.includes(shape)) {
            return { fromPlayer, toPlayer, shape };
          }
        }
      }
    }
    
    return null;
  };

  const getCurrentState = () => {
    // Eğer hiç şekil seçilmemişse veya bazı şekiller eksikse
    if (selectedShapes.length === 0 || selectedShapes.length < 3 || !selectedShapes.every(Boolean)) {
      return 'selectMainShape';
    }

    // Eğer main shape'ler belirli ama sub shape'ler belirli değilse
    if (selectedShapes.length === 3 && selectedShapes.every(shape => shape !== null)) {
      // Önce mainShape'leri güncelle
      const updatedSubShapes = selectedSubShapes.map((group, index) => ({
        ...group,
        mainShape: selectedShapes[index]
      }));

      // Boş sub shape grubunu bul
      const emptyGroupIndex = updatedSubShapes.findIndex(group => 
        group.shapes[1] === null
      );

      if (emptyGroupIndex !== -1) {
        return 'selectSubShape';
      }
    }

    // Eğer hem main shape'ler hem de sub shape'ler belirliyse
    if (selectedShapes.length === 3 && 
        selectedShapes.every(shape => shape !== null) && 
        selectedSubShapes.every(group => 
          group.mainShape !== null && 
          group.shapes.every(shape => shape !== null)
        )) {
      return 'puzzleSolutionGenerated';
    }

    return 'selectMainShape';
  };

  const updateGuidanceMessage = () => {
    const state = getCurrentState();
    
    if (!isLiveMode) {
      setGuidanceMessage('Simulation Mode');
      setIsGuidanceSuccess(false);
      return;
    }
    
    if (state === 'selectMainShape') {
      const playerIndex = activeColumn - 1;
      setGuidanceMessage(`Please select a shape for ${playerNames[playerIndex] || `Player ${playerIndex + 1}`}`);
      setIsGuidanceSuccess(false);
    } else if (state === 'selectSubShape') {
      const emptyGroupIndex = selectedSubShapes.findIndex(group => group.shapes[1] === null);
      setGuidanceMessage(`Please select a second shape for ${playerNames[emptyGroupIndex] || `Player ${emptyGroupIndex + 1}`}`);
      setIsGuidanceSuccess(false);
    } else if (state === 'puzzleSolutionGenerated') {
      setGuidanceMessage('Puzzle solution has been generated');
      setIsGuidanceSuccess(true);
    } else {
      const playerIndex = activeColumn - 1;
      setGuidanceMessage(`Please select a shape for ${playerNames[playerIndex] || `Player ${playerIndex + 1}`}`);
      setIsGuidanceSuccess(false);
    }
  };

  return (
    <div className="page">
      <main className="main">
        <div className="titleContainer">
          <Image
            src="/salvation.png"
            alt="Salvation's Edge"
            width={80}
            height={80}
            className="titleIcon"
          />
          <h1 className="title">Verity Solver</h1>
          <p className="subtitle">A puzzle solver/simulator for the Verity encounter in Salvation's Edge raid</p>
        </div>
        
        <div className="modeToggle">
          <button 
            className={`toggleButton ${isLiveMode ? 'active' : ''}`}
            onClick={(e) => {
              setIsLiveMode(true);
              setSelectedShapes([]);
              setSelectedSubShapes([
                { mainShape: null, shapes: [null, null] },
                { mainShape: null, shapes: [null, null] },
                { mainShape: null, shapes: [null, null] }
              ]);
              setActiveColumn(1);
              updateGuidanceMessage();
              e.target.blur();
            }}
          >
            Live Mode
          </button>
          <button 
            className={`toggleButton ${!isLiveMode ? 'active' : ''}`}
            onClick={(e) => {
              setIsLiveMode(false);
              if (selectedShapes.length === 3 && selectedShapes.every(shape => shape !== null)) {
                generateNewSubShapes(selectedShapes);
              }
              e.target.blur();
            }}
          >
            Simulation Mode
          </button>
        </div>

        <div className="container appContainer">
          <div className="startingShapes">
            <h3 className="sectionTitle">Starting Shapes</h3>
            <div className="columns">
              {[1, 2, 3].map((column) => (
                <div 
                  key={column} 
                  className={`column ${activeColumn === column && !(selectedShapes.length === 3 && selectedShapes.every(Boolean)) ? 'active' : ''}`}
                >
                  <div className="playerHeader">
                    <input
                      type="text"
                      value={playerNames[column - 1]}
                      onChange={(e) => handlePlayerNameChange(column - 1, e.target.value)}
                      className="playerNameInput"
                      placeholder={`Player ${column}`}
                      tabIndex={column}
                      maxLength={40}
                    />
                  </div>
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
          </div>

          {selectedShapes.length === 3 && selectedShapes.every(shape => shape !== null) && (
            <>
              <div className="playerShapes">
                <div className="titleRow">
                  <div className="titleControls">
                    <h3 className="sectionTitle">Player Shapes</h3>
                    {!isLiveMode && (
                      <button 
                        className="refreshButton"
                        onClick={() => {
                          if (!isLiveMode) {
                            generateNewSubShapes(selectedShapes);
                          }
                        }}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4C7.58 4 4.01 7.58 4.01 12C4.01 16.42 7.58 20 12 20C15.73 20 18.84 17.45 19.73 14H17.65C16.83 16.33 14.61 18 12 18C8.69 18 6 15.31 6 12C6 8.69 8.69 6 12 6C13.66 6 15.14 6.69 16.22 7.78L13 11H20V4L17.65 6.35Z" fill="currentColor"/>
                        </svg>
                      </button>
                    )}
                  </div>
                  {!isLiveMode && (
                    <div className="optionsDropdown">
                      <CustomDropdown
                        options={[
                          { value: 'random', label: 'Random' },
                          { value: 'noDouble', label: 'No Double' },
                          { value: 'oneDouble', label: 'One Double' },
                          { value: 'threeDoubles', label: 'Three Doubles' }
                        ]}
                        value={optionsMode}
                        onChange={(value) => setOptionsMode(value)}
                        size="small"
                      />
                    </div>
                  )}
                </div>
                <div className="columns">
                  {selectedShapes.map((mainShape, index) => (
                    <div key={index} className="column">
                      <div className={`mainShape ${mainShape}`} />
                      <div className="subShapes">
                        <div className={`subShape ${mainShape}`} />
                        {isLiveMode ? (
                          selectedSubShapes[index].shapes[1] ? (
                            <div className={`subShape ${selectedSubShapes[index].shapes[1]}`} />
                          ) : (
                            <div className={`subShapeButtons ${activeSubShapeGroup === index ? 'active' : ''}`}>
                              {getAvailableShapes(index).map((shape) => (
                                <button
                                  key={shape}
                                  className={`subShapeButton ${shape} ${selectedSubShapes[index].shapes[1] === shape ? 'selected' : ''}`}
                                  onClick={() => handleSubShapeSelect(shape, index * 2 + 1)}
                                >
                                  <div className={shape} />
                                </button>
                              ))}
                            </div>
                          )
                        ) : (
                          <div className={`subShape ${selectedSubShapes[index].shapes[1]}`} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedSubShapes.every(group => 
                group.mainShape !== null && 
                group.shapes.every(shape => shape !== null)
              ) && (
                <>
                  <div className="puzzleSteps">
                    <div className="titleRow">
                      <h3 className="sectionTitle">Puzzle Steps</h3>
                    </div>
                    <div className="columns">
                      {selectedShapes.map((mainShape, index) => {
                        const playerMoves = solutionSteps
                          .filter(step => step.fromPlayer === index)
                          .map(step => ({
                            shape: step.shape,
                            targetPlayer: step.toPlayer,
                            stepNumber: step.step
                          }));

                        return (
                          <div key={index} className="column">
                            <h3 className="columnTitle">
                              <div className={`shape ${mainShape}`} />
                              {playerNames[index]}
                            </h3>
                            <div className="puzzleMoves">
                              {playerMoves.length > 0 ? (
                                <>
                                  {playerMoves.map((move, moveIndex) => (
                                    <div key={moveIndex} className="requiredMove">
                                      <div className="tooltip">
                                        {`${playerNames[index]} sends ${move.shape} to ${playerNames[move.targetPlayer]}`}
                                      </div>
                                      <div className="moveInfo">
                                        <div className={`shape ${move.shape}`} />
                                        <svg className="arrow" viewBox="0 0 24 24" width="24" height="24">
                                          <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" fill="currentColor"/>
                                        </svg>
                                        <span className="targetLabel">
                                          <div className={`shape ${selectedShapes[move.targetPlayer]}`} />
                                          {playerNames[move.targetPlayer]}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                  <div className="finalShapes">
                                    <div className='finalShapesTitle'>Final Shapes</div>
                                    <div className='finalShapesContainer'>
                                    {solutionSteps[solutionSteps.length - 1]?.state[index].shapes.map((shape, shapeIndex) => (
                                      <>
                                        <div className={`shape ${shape}`} />
                                        {shapeIndex < solutionSteps[solutionSteps.length - 1]?.state[index].shapes.length - 1 && (
                                          <svg className="plus" viewBox="0 0 24 24" width="24" height="24">
                                            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/>
                                          </svg>
                                        )}
                                      </>
                                    ))}
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <div className="requiredMove">
                                  <div className="tooltip">No moves required</div>
                                  <div className="moveInfo">
                                    <span className="targetLabel">No moves required</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="solutionSummary">
                      {solutionSteps.map((step, index) => {
                        const currentPlayer = playerNames[step.fromPlayer];
                        const nextPlayer = index < solutionSteps.length - 1 ? playerNames[solutionSteps[index + 1].fromPlayer] : null;
                        const separator = nextPlayer && nextPlayer !== currentPlayer ? '\n' + '-'.repeat(50) + '\n' : '\n';
                        
                        return `${currentPlayer}, please send a ${step.shape} to ${playerNames[step.toPlayer]}${index === solutionSteps.length - 1 ? '' : separator}`;
                      }).join('')}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>
      <div className={`guidanceBox ${isGuidanceSuccess ? 'success' : ''}`}>
        <p>{guidanceMessage}</p>
      </div>
    </div>
  );
}