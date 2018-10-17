'use strict';

/**
 * Timer
 * Models the behavior of a timer. Given a start time and duration, it will
 * calculate when timer is expired, report how much time is remaining. All time
 * is represented in UNIX time in milliseconds.
 */
class Timer {

  constructor(startTime, duration) {
    this.startTime = startTime;
    this.duration = duration;
  }

  isExpired() {
    return (this.now() - this.duration) > this.startTime;
  }

  timeRemaining() {
    return this.duration - (this.now() - this.startTime);
  }

  now() {
    return new Date().getTime();
  }
}

module.exports = Timer;
