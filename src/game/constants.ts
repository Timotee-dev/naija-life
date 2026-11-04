// Numbers that control how the game feels. Units are metres and seconds.

export const WALK_SPEED = 4.3;
export const RUN_SPEED = 8.8;
export const JUMP_SPEED = 6.4;
export const GRAVITY = 18;
export const PLAYER_RADIUS = 0.4;

/** You can walk anywhere inside this square. */
export const MAP_LIMIT = 104;

/** How close you must be to see a [ENTER] / [TALK] prompt. */
export const INTERACT_RANGE = 2.7;
export const TALK_RANGE = 2.3;

/** 1 real second = this many game minutes (at "Normal" time speed). One game day ≈ 24 real minutes. */
export const MINUTES_PER_SECOND = 1;

/** A new game starts on Day 1 (Monday) at this hour. */
export const START_HOUR = 7;
