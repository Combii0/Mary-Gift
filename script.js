document.addEventListener("DOMContentLoaded", () => {
  initSecretForm();
  initLovePage();
});

function initSecretForm() {
  const form = document.getElementById("secret-form");
  const codeInputs = Array.from(document.querySelectorAll(".code-input"));
  const errorMessage = document.getElementById("error-message");

  if (!form || !codeInputs.length) return;

  function focusInput(index) {
    const target = codeInputs[index];
    if (target) target.focus();
  }

  function getCodeValue() {
    return codeInputs.map((input) => (input.value || "").trim()).join("");
  }

  function resetCode() {
    codeInputs.forEach((input) => {
      input.value = "";
    });
    focusInput(0);
  }

  codeInputs.forEach((input, index) => {
    input.addEventListener("input", (event) => {
      const value = (event.target.value || "").replace(/\D/g, "");
      event.target.value = value.slice(0, 1);
      if (value && index < codeInputs.length - 1) {
        focusInput(index + 1);
      }
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Backspace" && !event.target.value && index > 0) {
        focusInput(index - 1);
      }
    });

    input.addEventListener("paste", (event) => {
      event.preventDefault();
      const pasted = (event.clipboardData?.getData("text") || "").replace(/\D/g, "").slice(0, 4);
      pasted.split("").forEach((char, charIndex) => {
        if (charIndex < codeInputs.length) {
          codeInputs[charIndex].value = char;
        }
      });
      const filled = Math.min(pasted.length, codeInputs.length - 1);
      focusInput(filled);
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = getCodeValue();

    if (value.length < codeInputs.length) {
      if (errorMessage) {
        errorMessage.textContent = "Completa los 4 dígitos ❤️";
      }
      focusInput(value.length);
      return;
    }

    if (value === "4003") {
      try {
        sessionStorage.setItem("loveAccess", "granted");
      } catch (_) {}
      window.location.href = "te-amo.html";
    } else {
      if (errorMessage) {
        errorMessage.textContent = "Mmm... ese no es el código correcto ❤️";
      }
      resetCode();
    }
  });

  focusInput(0);
}

function initLovePage() {
  const loveCard = document.querySelector(".card--love");
  const songsSection = document.querySelector(".section--songs");
  const playerWrapper = document.getElementById("audio-player-ui");
  const audioElement = document.getElementById("audio-player");
  const playerTitle = document.getElementById("player-track-title");
  const playerArtist = document.getElementById("player-track-artist");
  const btnPlay = document.getElementById("btn-play");
  const btnNext = document.getElementById("btn-next");
  const btnPrev = document.getElementById("btn-prev");
  const btnVolume = document.getElementById("btn-volume");
  const btnTogglePlayer = document.getElementById("btn-toggle-player");
  const volumeContainer = document.getElementById("volume-container");
  const volumeSlider = document.getElementById("volume-slider");
  const progressContainer = document.getElementById("progress-container");
  const progressSlider = document.getElementById("progress-slider");
  const progressCurrent = document.getElementById("progress-current");
  const progressDuration = document.getElementById("progress-duration");
  const coverImage = document.getElementById("player-cover");
  const songListContainer = document.getElementById("song-list");
  const playerPlaceholder = document.getElementById("audio-player-placeholder");
  const galleryButton = document.getElementById("open-gallery");
  const galleryModal = document.getElementById("gallery-modal");
  const galleryModalBackdrop = document.getElementById("gallery-modal-backdrop");
  const galleryModalClose = document.getElementById("gallery-modal-close");
  const galleryGrid = document.getElementById("gallery-grid");
  const photoModal = document.getElementById("photo-modal");
  const photoModalImage = document.getElementById("photo-modal-image");
  const photoModalClose = document.getElementById("photo-modal-close");
  const photoModalBackdrop = document.getElementById("photo-modal-backdrop");

  if (!loveCard) return;
  try {
    const access = sessionStorage.getItem("loveAccess");
    if (access !== "granted") {
      window.location.href = "index.html";
      return;
    }
  } catch (_) {
    window.location.href = "index.html";
    return;
  }
  let playerAnchor = null;
  if (playerWrapper && songsSection) {
    playerAnchor = document.createElement("div");
    playerAnchor.style.display = "none";
    songsSection.insertAdjacentElement("afterend", playerAnchor);
  }

  // Playlist configuration
  const tracks = [
    {
      id: "porti",
      title: "Por Ti",
      artist: "3AM",
      src: "assets/music/porti.mp3",
      icon: "♪",
    },
    {
      id: "alma",
      title: "Alma",
      artist: "3AM",
      src: "assets/music/alma.mp3",
      icon: "♡",
    },
    {
      id: "cancionbonita",
      title: "Canción Bonita",
      artist: "3AM",
      src: "assets/music/cancionbonita.mp3",
      icon: "★",
    },
    {
      id: "tumeencantas",
      title: "Tú me encantas",
      artist: "3AM",
      src: "assets/music/tumeencantas.mp3",
      icon: "❤",
    },
    {
      id: "bombon",
      title: "Bombón",
      artist: "3AM",
      src: "assets/music/bombon.mp3",
      icon: "✧",
    },
  ];

  // If audio player is not present, nothing else to do
  if (!audioElement || !playerTitle || !btnPlay || !btnNext || !btnPrev) {
    return;
  }

  let currentIndex = 0;
  let isPlaying = false;
  let songCards = [];
  const DEFAULT_VOLUME = 0.8;
  let isPlayerHidden = false;
  let isSeeking = false;
  let progressPeekTimeout = null;

  function setProgressValue(percent) {
    if (!progressSlider) return;
    const clamped = Math.min(100, Math.max(0, percent));
    progressSlider.value = String(clamped);
    progressSlider.style.setProperty("--progress", `${clamped}%`);
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${mins}:${secs}`;
  }

  function updateVolumeIcon() {
    if (!btnVolume) return;
    const volume = audioElement.volume;
    let icon = "🔊";
    if (volume === 0) {
      icon = "🔇";
    } else if (volume < 0.4) {
      icon = "🔈";
    }
    const iconImage = btnVolume.querySelector("img");
    if (iconImage) {
      btnVolume.setAttribute("data-volume-state", icon);
    } else {
      btnVolume.textContent = icon;
    }
  }

  if (volumeSlider) {
    const initialValue = Number(volumeSlider.value || String(DEFAULT_VOLUME * 100));
    const normalized = Math.max(0, Math.min(1, initialValue / 100));
    audioElement.volume = normalized;
    volumeSlider.value = String(Math.round(normalized * 100));
    updateVolumeIcon();

    volumeSlider.addEventListener("input", () => {
      const sliderValue = Number(volumeSlider.value || "0");
      const newVolume = Math.max(0, Math.min(1, sliderValue / 100));
      audioElement.volume = newVolume;
      updateVolumeIcon();
    });
  } else {
    audioElement.volume = DEFAULT_VOLUME;
    updateVolumeIcon();
  }

  function createSongCards() {
    if (!songListContainer) return;
    tracks.forEach((track, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "song-card";
      button.dataset.index = String(index);
      button.innerHTML = `
        <div class="song-card__icon">${track.icon}</div>
        <div class="song-card__text">
          <div class="song-card__title">${track.title}</div>
          <div class="song-card__subtitle">${track.artist}</div>
        </div>
      `;
      button.addEventListener("click", () => {
        const idx = Number(button.dataset.index || "0");
        if (idx === currentIndex && isPlaying) {
          pause();
        } else {
          loadTrack(idx);
          play();
        }
      });
      songListContainer.appendChild(button);
    });
    songCards = Array.from(songListContainer.querySelectorAll(".song-card"));
  }

  function highlightActiveSong() {
    if (!songCards.length) return;
    songCards.forEach((card, index) => {
      if (index === currentIndex) {
        card.classList.add("song-card--active");
      } else {
        card.classList.remove("song-card--active");
      }
    });
  }

  function setPlayButtonState(playing) {
    isPlaying = playing;
    btnPlay.textContent = playing ? "⏸" : "▶";
  }

  function loadTrack(index) {
    if (index < 0 || index >= tracks.length) return;
    currentIndex = index;
    const track = tracks[currentIndex];
    audioElement.src = track.src;
    playerTitle.textContent = track.title;
    if (playerArtist) {
      playerArtist.textContent = track.artist;
    }
    setProgressValue(0);
    if (progressCurrent) {
      progressCurrent.textContent = "0:00";
    }
    if (progressDuration) {
      progressDuration.textContent = "0:00";
    }
    highlightActiveSong();
  }

  function play() {
    audioElement
      .play()
      .then(() => {
        setPlayButtonState(true);
      })
      .catch(() => {
        // Es posible que el navegador bloquee la reproducción automática
        setPlayButtonState(false);
      });
  }

  function pause() {
    audioElement.pause();
    setPlayButtonState(false);
  }

  function nextTrack() {
    const nextIndex = (currentIndex + 1) % tracks.length;
    loadTrack(nextIndex);
    play();
  }

  function prevTrack() {
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    loadTrack(prevIndex);
    play();
  }

  btnPlay.addEventListener("click", () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  });

  btnNext.addEventListener("click", () => {
    nextTrack();
  });

  btnPrev.addEventListener("click", () => {
    prevTrack();
  });

  function hidePlayerUI() {
    if (!playerWrapper || !playerPlaceholder) return;
    if (window.innerWidth >= 900) return;
    isPlayerHidden = true;
    hideMobileProgressPeek();
    playerWrapper.classList.add("audio-player--collapsed");
    playerPlaceholder.classList.add("audio-player-placeholder--visible");
  }

  function showPlayerUI() {
    if (!playerWrapper || !playerPlaceholder) return;
    isPlayerHidden = false;
    hideMobileProgressPeek();
    playerWrapper.classList.remove("audio-player--collapsed");
    playerPlaceholder.classList.remove("audio-player-placeholder--visible");
  }

  if (btnTogglePlayer) {
    btnTogglePlayer.addEventListener("click", () => {
      if (isPlayerHidden) {
        showPlayerUI();
      } else {
        hidePlayerUI();
      }
    });
  }

  if (playerPlaceholder) {
    playerPlaceholder.addEventListener("click", () => {
      showPlayerUI();
    });
  }

  if (btnVolume && volumeContainer) {
    btnVolume.addEventListener("click", (event) => {
      event.stopPropagation();
      const isOpen = volumeContainer.classList.toggle("audio-player__volume--open");
      if (playerWrapper) {
        if (isOpen) {
          playerWrapper.classList.add("audio-player--expanded");
        } else {
          playerWrapper.classList.remove("audio-player--expanded");
        }
      }
    });
  }

  audioElement.addEventListener("ended", () => {
    nextTrack();
  });

  function hideMobileProgressPeek() {
    if (progressPeekTimeout) {
      clearTimeout(progressPeekTimeout);
      progressPeekTimeout = null;
    }
    if (playerWrapper) {
      playerWrapper.classList.remove("audio-player--progress-open");
    }
    if (progressContainer) {
      progressContainer.classList.remove("audio-player__progress--mobile-visible");
    }
  }

  function showMobileProgressPeek() {
    if (!playerWrapper || !progressContainer) return;
    if (window.innerWidth >= 900) return;
    if (playerWrapper.classList.contains("audio-player--collapsed")) return;
    playerWrapper.classList.add("audio-player--progress-open");
    progressContainer.classList.add("audio-player__progress--mobile-visible");
    if (progressPeekTimeout) clearTimeout(progressPeekTimeout);
    progressPeekTimeout = window.setTimeout(() => {
      hideMobileProgressPeek();
    }, 4000);
  }

  if (playerWrapper) {
    playerWrapper.addEventListener("click", (event) => {
      const target = event.target;
      if (
        target.closest(".audio-player__button") ||
        target.closest(".audio-player__volume-slider") ||
        target.closest(".audio-player__progress-slider")
      ) {
        return;
      }
      showMobileProgressPeek();
    });
  }

  audioElement.addEventListener("loadedmetadata", () => {
    if (progressDuration && audioElement.duration) {
      progressDuration.textContent = formatTime(audioElement.duration);
    }
  });

  audioElement.addEventListener("timeupdate", () => {
    if (!progressSlider || !progressCurrent || isSeeking) return;
    const { currentTime, duration } = audioElement;
    progressCurrent.textContent = formatTime(currentTime);
    if (duration && Number.isFinite(duration)) {
      const percent = Math.min(100, Math.max(0, (currentTime / duration) * 100));
      setProgressValue(percent);
    }
  });

  if (progressSlider) {
    progressSlider.addEventListener("input", () => {
      isSeeking = true;
      const percent = Number(progressSlider.value || "0");
      setProgressValue(percent);
      if (audioElement.duration && Number.isFinite(audioElement.duration)) {
        const newTime = (percent / 100) * audioElement.duration;
        if (progressCurrent) {
          progressCurrent.textContent = formatTime(newTime);
        }
      }
    });

    progressSlider.addEventListener("change", () => {
      const percent = Number(progressSlider.value || "0");
      if (audioElement.duration && Number.isFinite(audioElement.duration)) {
        const newTime = (percent / 100) * audioElement.duration;
        audioElement.currentTime = newTime;
      }
      isSeeking = false;
    });
  }

  createSongCards();
  loadTrack(0);
  // Intentar reproducir al entrar en la página
  play();

  // Colocar el reproductor dentro de la card en escritorio y flotante en móvil
  function placePlayer() {
    if (!playerWrapper || !playerAnchor) return;

    if (window.innerWidth >= 900) {
      if (playerWrapper.previousElementSibling === playerAnchor) return;
      playerAnchor.insertAdjacentElement("afterend", playerWrapper);
      playerWrapper.style.removeProperty("left");
      playerWrapper.style.removeProperty("right");
      playerWrapper.style.removeProperty("bottom");
      playerWrapper.style.removeProperty("top");
      showPlayerUI();
      hideMobileProgressPeek();
    } else {
      if (playerWrapper.parentElement === document.body) return;
      document.body.appendChild(playerWrapper);
      playerWrapper.style.removeProperty("top");
      if (isPlayerHidden) {
        playerWrapper.classList.add("audio-player--collapsed");
        if (playerPlaceholder) {
          playerPlaceholder.classList.add("audio-player-placeholder--visible");
        }
      }
    }
  }

  placePlayer();
  window.addEventListener("resize", placePlayer);

  // Galería de fotos
  const photoPaths = [
    "assets/images/us/one.jpg",
    "assets/images/us/two.jpg",
    "assets/images/us/three.jpg",
    "assets/images/us/four.jpg",
    "assets/images/us/five.jpg",
    "assets/images/us/six.jpg",
    "assets/images/us/seven.jpg",
    "assets/images/us/eight.jpg",
    "assets/images/us/nine.jpg",
    "assets/images/us/ten.jpg",
    "assets/images/us/eleven.jpg",
    "assets/images/us/twelve.jpg",
    "assets/images/us/fourteen.jpg",
    "assets/images/us/fifteen.jpg",
    "assets/images/us/sixteen.jpg",
    "assets/images/us/seventeen.jpg",
    "assets/images/us/thirdteen.jpg",
  ];

  if (coverImage && photoPaths.length > 0) {
    let coverIndex = 0;

    function updateCoverImage() {
      coverImage.src = photoPaths[coverIndex];
      coverIndex = (coverIndex + 1) % photoPaths.length;
    }

    updateCoverImage();
    setInterval(updateCoverImage, 60000);
  }

  // Cerrar control de volumen al hacer clic fuera
  document.addEventListener("click", (event) => {
    if (!volumeContainer || !btnVolume) return;
    if (!volumeContainer.classList.contains("audio-player__volume--open")) return;

    const target = event.target;
    if (volumeContainer.contains(target) || btnVolume.contains(target)) {
      return;
    }

    volumeContainer.classList.remove("audio-player__volume--open");
    if (playerWrapper) {
      playerWrapper.classList.remove("audio-player--expanded");
    }
  });

  if (
    galleryGrid &&
    galleryModal &&
    galleryModalBackdrop &&
    galleryModalClose &&
    photoModal &&
    photoModalImage &&
    photoModalClose &&
    photoModalBackdrop
  ) {
    photoPaths.forEach((path) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "photo-card";
      const img = document.createElement("img");
      img.src = path;
      img.alt = "Foto de nosotros";
      card.appendChild(img);
      card.addEventListener("click", () => {
        openPhotoModal(path);
      });
      galleryGrid.appendChild(card);
    });

    function openGalleryModal() {
      galleryModal.classList.add("gallery-modal--open");
      galleryModal.setAttribute("aria-hidden", "false");
      document.body.classList.add("body--no-scroll");
    }

    function closeGalleryModal() {
      galleryModal.classList.remove("gallery-modal--open");
      galleryModal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("body--no-scroll");
    }

    function openPhotoModal(src) {
      photoModalImage.src = src;
      photoModal.classList.add("photo-modal--open");
      photoModal.setAttribute("aria-hidden", "false");
    }

    function closePhotoModal() {
      photoModal.classList.remove("photo-modal--open");
      photoModal.setAttribute("aria-hidden", "true");
      photoModalImage.src = "";
    }

    photoModalClose.addEventListener("click", () => {
      closePhotoModal();
    });

    photoModalBackdrop.addEventListener("click", () => {
      closePhotoModal();
    });

    if (galleryButton) {
      galleryButton.addEventListener("click", () => {
        openGalleryModal();
      });
    }

    galleryModalClose.addEventListener("click", () => {
      closeGalleryModal();
    });

    galleryModalBackdrop.addEventListener("click", () => {
      closeGalleryModal();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        if (photoModal.classList.contains("photo-modal--open")) {
          closePhotoModal();
        } else if (galleryModal.classList.contains("gallery-modal--open")) {
          closeGalleryModal();
        }
      }
    });
  }
}
