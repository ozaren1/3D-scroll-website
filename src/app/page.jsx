"use client"
import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import styles from "/Home.module.scss";

const blocks = [
  { id: 1, title: "Block 1", description: "Description for block 1" },
  { id: 2, title: "Block 2", description: "Description for block 2" },
  { id: 3, title: "Block 3", description: "Description for block 3" },
];

export default function Home() {
  const containerRef = useRef(null);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0); // Индекс текущего блока
  const [isAnimating, setIsAnimating] = useState(false); // Чтобы предотвратить резкий скролл

  useEffect(() => {
    const handleWheel = (event) => {
      if (isAnimating) return; // Блокируем действия, пока идет анимация

      const deltaY = event.deltaY;

      if (deltaY > 0 && currentBlockIndex < blocks.length - 1) {
        // Скроллим вперед
        setIsAnimating(true);
        animateBlock(currentBlockIndex, currentBlockIndex + 1);
      } else if (deltaY < 0 && currentBlockIndex > 0) {
        // Скроллим назад
        setIsAnimating(true);
        animateBlock(currentBlockIndex, currentBlockIndex - 1);
      }
    };

    window.addEventListener("wheel", handleWheel);

    return () => window.removeEventListener("wheel", handleWheel);
  }, [currentBlockIndex, isAnimating]);

  const animateBlock = (fromIndex, toIndex) => {
    const currentBlock = document.getElementById(`block-${fromIndex}`);
    const nextBlock = document.getElementById(`block-${toIndex}`);

    // Анимация текущего блока (исчезает)
    gsap.to(currentBlock, {
      scale: 0.8,
      opacity: 0,
      duration: 0.8,
      ease: "power2.out",
      onComplete: () => {
        // Скрываем текущий блок
        currentBlock.style.display = "none";

        // Показываем следующий блок
        nextBlock.style.display = "flex";
        gsap.fromTo(
          nextBlock,
          { scale: 1.2, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.8,
            ease: "power2.out",
            onComplete: () => setIsAnimating(false),
          }
        );
        setCurrentBlockIndex(toIndex); // Меняем текущий индекс
      },
    });
  };

  return (
    <div ref={containerRef} className={styles.container}>
      {blocks.map((block, index) => (
        <div
          key={block.id}
          id={`block-${index}`}
          className={styles.block}
          style={{
            display: index === 0 ? "flex" : "none", // Показываем только первый блок
          }}
        >
          <h1>{block.title}</h1>
          <p>{block.description}</p>
        </div>
      ))}
    </div>
  );
}

