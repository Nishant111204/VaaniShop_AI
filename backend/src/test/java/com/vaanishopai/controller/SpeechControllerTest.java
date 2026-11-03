package com.vaanishopai.controller;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class SpeechControllerTest {

  @Test
  void keepsKnownAudioExtensions() {
    assertEquals("mp4", SpeechController.audioExtension("audio.mp4"));
    assertEquals("ogg", SpeechController.audioExtension("AUDIO.OGG"));
  }

  @Test
  void fallsBackToWebmForAnythingElse() {
    assertEquals("webm", SpeechController.audioExtension(null));
    assertEquals("webm", SpeechController.audioExtension("audio"));
    assertEquals("webm", SpeechController.audioExtension("x.php"));
    assertEquals("webm", SpeechController.audioExtension("../../etc/passwd"));
  }
}
