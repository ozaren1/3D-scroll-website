"use client";
import React, { useEffect, useLayoutEffect, useRef } from "react";
import styles from "./Home.module.scss";
import clsx from "clsx";
import items from "./data"
export default function Home() {
  const framesRef = useRef<HTMLDivElement[]>([]); // Ссылки на элементы

  useLayoutEffect(() => {
    const zSpacing = -1500; // Расстояние между слоями
    let lastScrollTop = 0; // Предыдущее положение скролла

    const zVals = framesRef.current.map((_, i) => i * zSpacing); // Изначальные позиции по Z

    const handleScroll = () => {
      const top = document.documentElement.scrollTop; // Текущее положение скролла
      const delta = lastScrollTop - top; // Разница в скролле
      lastScrollTop = top; // Обновляем последнее положение скролла

      framesRef.current.forEach((elem, i) => {
        zVals[i] += delta * -4; // Управление скоростью движения
        let Opacity:number = zVals[i] < Math.abs(zSpacing) / 1.5 ? 1 : 0;
        elem.style.transform = `translateZ(${zVals[i]}px)`; // Перемещение по оси Z
        elem.style.opacity = `${Opacity}`; 
      });
    };

    window.addEventListener("scroll", handleScroll);
    window.scrollTo(0, 1)
    return () => window.removeEventListener("scroll", handleScroll);

    
  }, []);

 

  return (
    <div className={styles.container}>
      <section className={styles.gallery}>
        {items.map((item, index) => (
          <div
            key={item.id}
            className={clsx(
              styles.frame,  
              {
                [styles.frame_bg]: item.background, // Добавляем, если item.background true
              })
              }
            ref={(el) => {
              if (el) framesRef.current[index] = el;
            }}
          >
            
            {item.text ? (
              <div className={clsx(
                styles.frame_media, 
                { 
                  [styles.vertical]: item.type === "vertical",
                  [styles.horizontal]: item.type === "horizontal",
                  [styles.frame_media_left]: item.position === "left", 
                  [styles.frame_media_right]: item.position === "right" 
                }
              )} >
                <div className={styles.text}><p>{item.content}</p></div>
                </div>
            ) : (
            <video 
              className={clsx(
                styles.frame_media, 
                { 
                  [styles.vertical]: item.type === "vertical",
                  [styles.horizontal]: item.type === "horizontal",
                  [styles.frame_media_left]: item.position === "left", 
                  [styles.frame_media_right]: item.position === "right" 
                }
              )} 
              src={item.src}  
              autoPlay 
              muted 
              loop
            />
              
            )}
            </div>
         
        ))}
      </section>
    </div>
  );
}
