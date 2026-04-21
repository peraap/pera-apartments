import { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useScroll } from 'motion/react';

export const TextReveal = ({ text, className = "" }: { text: string, className?: string }) => {
  const words = text.split(" ");
  return (
    <span className={`inline-block ${className}`}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden mr-2">
          <motion.span
            initial={{ y: "100%" }}
            whileInView={{ y: 0 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.8,
              delay: i * 0.05,
              ease: [0.2, 0.65, 0.3, 0.9],
            }}
            className="inline-block"
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  );
};

export const LineReveal = ({ text, className = "" }: { text: string, className?: string }) => {
  return (
    <div className={`overflow-hidden ${className}`}>
      <motion.span
        initial={{ y: "100%" }}
        whileInView={{ y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: [0.2, 0.65, 0.3, 0.9] }}
        className="block"
      >
        {text}
      </motion.span>
    </div>
  );
};

export const ParallaxImage = ({ src, alt, className = "" }: { src: string, alt: string, className?: string }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.img
        src={src}
        alt={alt}
        style={{ scale: 1.2, y }}
        className="w-full h-full object-cover"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

export const AnimatedSection = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 1, ease: [0.2, 0.65, 0.3, 0.9] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const TiltCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={`perspective-1000 ${className}`}
    >
      <div style={{ transform: "translateZ(50px)", transformStyle: "preserve-3d" }}>
        {children}
      </div>
    </motion.div>
  );
};

export const Magnetic = ({ children }: { children: React.ReactElement }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current!.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * 0.1, y: middleY * 0.1 });
  };

  const reset = () => {
    setPosition({ x: 0, y: 0 });
  };

  const { x, y } = position;

  return (
    <motion.div
      style={{ position: "relative" }}
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x, y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
    >
      {children}
    </motion.div>
  );
};

export const GlowWrapper = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  return (
    <div className={`relative group ${className}`}>
      <div className="absolute -inset-1 bg-gradient-to-r from-primary-accent to-white rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-1000 group-hover:duration-200"></div>
      <div className="relative">
        {children}
      </div>
    </div>
  );
};

export const FloatingElement = ({ children, duration = 4, delay = 0, yOffset = 15 }: { children: React.ReactNode, duration?: number, delay?: number, yOffset?: number }) => {
  return (
    <motion.div
      animate={{
        y: [0, -yOffset, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay
      }}
    >
      {children}
    </motion.div>
  );
};

export const NanoBanana = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  return (
    <motion.div
      animate={{
        y: [0, -12, 0],
        rotate: [0, 1.5, -1.5, 0],
      }}
      transition={{
        duration: 5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const Reveal3D = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => {
  return (
    <div className="perspective-1000">
      <motion.div
        initial={{ opacity: 0, rotateX: 45, y: 50, scale: 0.9 }}
        whileInView={{ opacity: 1, rotateX: 0, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1.2, ease: [0.2, 0.65, 0.3, 0.9], delay }}
        className={`preserve-3d ${className}`}
      >
        {children}
      </motion.div>
    </div>
  );
};

export const SkewScroll = ({ children }: { children: React.ReactNode }) => {
  const { scrollY } = useScroll();
  const [skew, setSkew] = useState(0);
  const prevScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const velocity = window.scrollY - prevScrollY.current;
      setSkew(Math.min(Math.max(velocity * 0.05, -10), 10));
      prevScrollY.current = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const smoothSkew = useSpring(skew, { stiffness: 100, damping: 30 });

  return (
    <motion.div style={{ skewY: smoothSkew }} className="origin-center">
      {children}
    </motion.div>
  );
};

export const SmoothIn = ({ children, direction = "up", delay = 0, className = "" }: { children: React.ReactNode, direction?: "up" | "down" | "left" | "right", delay?: number, className?: string }) => {
  const variants = {
    hidden: { 
      opacity: 0, 
      x: direction === "left" ? -50 : direction === "right" ? 50 : 0,
      y: direction === "up" ? 50 : direction === "down" ? -50 : 0,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      x: 0, 
      y: 0,
      scale: 1,
      transition: { 
        duration: 0.8, 
        ease: [0.2, 0.65, 0.3, 0.9],
        delay 
      }
    }
  } as any;

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const PhotoAlbum = ({ images, onImageClick }: { images: string[], onImageClick: (index: number) => void }) => {
  return (
    <div className="relative h-[65vh] md:h-[85vh] w-full flex items-center justify-center py-20 perspective-2000">
      <div className="relative w-full max-w-5xl h-full flex items-center justify-center preserve-3d">
        {images.map((img, i) => (
          <motion.div
            key={i}
            initial={{ rotate: 0, x: 0, opacity: 0, scale: 0.8, rotateY: 45 }}
            whileInView={{ 
              rotate: (i - (images.length - 1) / 2) * 8,
              x: (i - (images.length - 1) / 2) * 50,
              y: Math.sin(i * 0.5) * 20,
              rotateY: (i - (images.length - 1) / 2) * -5,
              opacity: 1,
              scale: 1,
              zIndex: i
            }}
            animate={{
              y: [null, Math.sin(i + Date.now()/1000) * 10, null]
            }}
            transition={{
              y: {
                repeat: Infinity,
                duration: 3 + i,
                ease: "easeInOut"
              },
              default: {
                delay: i * 0.1, 
                duration: 1.5, 
                type: "spring",
                damping: 20,
                stiffness: 100
              }
            }}
            viewport={{ once: true }}
            whileHover={{ 
              scale: 1.08, 
              rotate: 0, 
              rotateY: 0,
              x: (i - (images.length - 1) / 2) * 30,
              y: -50,
              zIndex: 100,
              transition: { duration: 0.4 }
            }}
            className="absolute h-full w-[280px] md:w-[500px] bg-white p-5 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border border-neutral-100 rounded-lg cursor-pointer origin-bottom preserve-3d group"
            onClick={() => onImageClick(i)}
          >
            <div className="relative h-full w-full overflow-hidden rounded-md preserve-3d">
              <img 
                src={img} 
                alt={`Album ${i}`} 
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 flex items-end p-8">
                <span className="text-white text-[10px] font-black uppercase tracking-[0.5em] translate-y-4 group-hover:translate-y-0 transition-transform">VIEW DETAIL</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export const VibrantGallery = ({ images, onImageClick }: { images: string[], onImageClick: (index: number) => void }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 py-10">
      {images.map((img, i) => (
        <NanoBanana key={i}>
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.6 }}
            whileHover={{ scale: 1.05, zIndex: 50 }}
            className="relative aspect-[4/5] md:aspect-square group cursor-pointer overflow-hidden rounded-3xl shadow-2xl border-4 border-white"
            onClick={() => onImageClick(i)}
          >
            <img 
              src={img} 
              alt={`Gallery ${i}`} 
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end p-8">
              <span className="text-white text-xs font-black uppercase tracking-[0.3em]">MOMENTE DE RELAXARE</span>
            </div>
          </motion.div>
        </NanoBanana>
      ))}
    </div>
  );
};
