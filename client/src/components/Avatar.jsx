/*
Auto-generated by: https://github.com/pmndrs/gltfjsx
Command: npx gltfjsx@6.2.3 public/models/Animated Woman.glb -o src/components/AnimatedWoman.jsx -r public
*/

import { Html, useAnimations, useGLTF } from "@react-three/drei";
import { useFrame, useGraph } from "@react-three/fiber";
import { useAtom } from "jotai";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { SkeletonUtils } from "three-stdlib";
import { useGrid } from "../hooks/useGrid";
import { socket, userAtom } from "./SocketManager";

import { motion } from "framer-motion-3d";

const MOVEMENT_SPEED = 4;

export function Avatar({
  id,
  avatarUrl = "https://models.readyplayer.me/64f0265b1db75f90dcfd9e2c.glb",
  ...props
}) {
  const [chatMessage, setChatMessage] = useState("");
  const position = useMemo(() => props.position, []);

  const avatar = useRef();
  const [path, setPath] = useState();
  const { gridToVector3 } = useGrid();

  const group = useRef();
  const { scene } = useGLTF(avatarUrl);
  // Skinned meshes cannot be re-used in threejs without cloning them
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  // useGraph creates two flat object collections for nodes and materials
  const { nodes } = useGraph(clone);

  const { animations: walkAnimation } = useGLTF("/animations/M_Walk_001.glb");
  const { animations: danceAnimation } = useGLTF(
    "/animations/M_Dances_001.glb"
  );
  const { animations: idleAnimation } = useGLTF(
    "/animations/M_Standing_Idle_001.glb"
  );

  const { actions } = useAnimations(
    [walkAnimation[0], idleAnimation[0], danceAnimation[0]],
    avatar
  );
  const [animation, setAnimation] = useState("M_Standing_Idle_001");
  const [isDancing, setIsDancing] = useState(false);
  const [init, setInit] = useState(false);
  const [showChatBubble, setShowChatBubble] = useState(false);

  useEffect(() => {
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [clone]);

  useEffect(() => {
    actions[animation]
      .reset()
      .fadeIn(init ? 0.32 : 0)
      .play();
    setInit(true);
    return () => actions[animation]?.fadeOut(0.32);
  }, [animation, avatarUrl]);

  useEffect(() => {
    function onPlayerDance(value) {
      if (value.id === id) {
        setIsDancing(true);
      }
    }
    function onPlayerMove(value) {
      if (value.id === id) {
        const path = [];
        value.path?.forEach((gridPosition) => {
          path.push(gridToVector3(gridPosition));
        });
        setPath(path);
      }
    }

    let chatMessageBubbleTimeout;
    function onPlayerChatMessage(value) {
      if (value.id === id) {
        setChatMessage(value.message);
        clearTimeout(chatMessageBubbleTimeout);
        setShowChatBubble(true);
        chatMessageBubbleTimeout = setTimeout(() => {
          setShowChatBubble(false);
        }, 3500);
      }
    }

    socket.on("playerMove", onPlayerMove);
    socket.on("playerDance", onPlayerDance);
    socket.on("playerChatMessage", onPlayerChatMessage);
    return () => {
      socket.off("playerDance", onPlayerDance);
      socket.off("playerMove", onPlayerMove);
      socket.off("playerChatMessage", onPlayerChatMessage);
    };
  }, [id]);

  const [user] = useAtom(userAtom);

  useFrame((_state, delta) => {
    const hips = avatar.current.getObjectByName("Hips");
    hips.position.set(0, hips.position.y, 0);
    if (path?.length && group.current.position.distanceTo(path[0]) > 0.1) {
      const direction = group.current.position
        .clone()
        .sub(path[0])
        .normalize()
        .multiplyScalar(MOVEMENT_SPEED * delta);
      group.current.position.sub(direction);
      group.current.lookAt(path[0]);
      setAnimation("M_Walk_001");
      setIsDancing(false);
    } else if (path?.length) {
      path.shift();
    } else {
      if (isDancing) {
        setAnimation("M_Dances_001");
      } else {
        setAnimation("M_Standing_Idle_001");
      }
    }
  });

  return (
    <group
      ref={group}
      {...props}
      position={position}
      dispose={null}
      name={`character-${id}`}
    >
      <Html position-y={2}>
        <div className="w-60 max-w-full">
          <p
            className={`absolute max-w-full text-center break-words -translate-y-full p-2 px-4 -translate-x-1/2 rounded-lg bg-white bg-opacity-40 backdrop-blur-sm text-black transition-opacity duration-500 ${
              showChatBubble ? "" : "opacity-0"
            }`}
          >
            {chatMessage}
          </p>
        </div>
      </Html>
      <motion.group
        initial={{
          y: 3,
          rotateY: Math.PI * 4,
          scale: 0,
        }}
        animate={{
          y: 0,
          rotateY: 0,
          scale: 1,
        }}
        transition={{
          delay: 0.8,
          mass: 5,
          stiffness: 200,
          damping: 42,
        }}
      >
        <primitive object={clone} ref={avatar} />
      </motion.group>
    </group>
  );
}

useGLTF.preload(
  localStorage.getItem("avatarURL") ||
    "https://models.readyplayer.me/64f0265b1db75f90dcfd9e2c.glb?meshlod=1&quality=medium"
);
useGLTF.preload("/animations/M_Walk_001.glb");
useGLTF.preload("/animations/M_Standing_Idle_001.glb");
useGLTF.preload("/animations/M_Dances_001.glb");
useGLTF.preload("/animations/M_Standing_Expressions_001.glb");
