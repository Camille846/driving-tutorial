'use client';

import { useState, useEffect, useRef } from 'react';
import quizData from '../data/quizData.json';
import styles from './page.module.css';

export default function Home() {
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [player, setPlayer] = useState(null);
  const intervalRef = useRef(null);
  const lastQuizTimestamp = useRef(null);

  useEffect(() => {
    console.log('Iniciando carregamento do player do YouTube...');
    // Carrega a API do YouTube
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    // Função global que o YouTube API chama quando está pronta
    window.onYouTubeIframeAPIReady = () => {
      console.log('API do YouTube carregada, inicializando player...');
      const newPlayer = new window.YT.Player('youtube-player', {
        videoId: quizData.videoUrl,
        playerVars: {
          'playsinline': 1,
          'origin': window.location.origin,
          'enablejsapi': 1,
        },
        events: {
          'onStateChange': onPlayerStateChange,
          'onReady': (event) => {
            console.log('Player está pronto!');
            const player = event.target;
            setPlayer(player);
            // Inicia a verificação do tempo quando o player estiver pronto
            startTimeCheck(player);
          }
        }
      });
    };

    return () => {
      window.onYouTubeIframeAPIReady = null;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Adiciona evento de teclado para bloquear controles do vídeo
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (showQuiz) {
        // Lista de teclas que controlam o vídeo
        const videoControlKeys = [
          ' ', // Espaço (play/pause)
          'ArrowLeft', // Seta esquerda (retroceder)
          'ArrowRight', // Seta direita (avançar)
          'ArrowUp', // Seta para cima (volume)
          'ArrowDown', // Seta para baixo (volume)
          'k', // Tecla K (play/pause)
          'm', // Tecla M (mudo)
          'f', // Tecla F (tela cheia)
          '0', // Tecla 0 (início do vídeo)
          '1', // Tecla 1 (10% do vídeo)
          '2', // Tecla 2 (20% do vídeo)
          '3', // Tecla 3 (30% do vídeo)
          '4', // Tecla 4 (40% do vídeo)
          '5', // Tecla 5 (50% do vídeo)
          '6', // Tecla 6 (60% do vídeo)
          '7', // Tecla 7 (70% do vídeo)
          '8', // Tecla 8 (80% do vídeo)
          '9', // Tecla 9 (90% do vídeo)
        ];

        if (videoControlKeys.includes(event.key)) {
          event.preventDefault();
          event.stopPropagation();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [showQuiz]);

  const startTimeCheck = (player) => {
    console.log('Iniciando verificação de tempo...');
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      try {
        const currentTime = Math.floor(player.getCurrentTime());
        console.log(`Vídeo rodando em ${currentTime} segundos`);
        checkQuizTime(player, currentTime);
      } catch (error) {
        console.error('Erro ao obter tempo do vídeo:', error);
      }
    }, 1000);
  };

  const onPlayerStateChange = (event) => {
    console.log('Estado do player mudou:', event.data);
    if (event.data === window.YT.PlayerState.PLAYING) {
      console.log('Vídeo começou a reproduzir');
      if (player) {
        startTimeCheck(player);
      }
    } else if (event.data === window.YT.PlayerState.PAUSED) {
      console.log('Vídeo pausado');
    }
  };

  const checkQuizTime = (player, currentTime) => {
    if (showQuiz) {
      return;
    }

    // Verifica se já passamos por este timestamp
    if (lastQuizTimestamp.current === currentTime) {
      return;
    }

    const quiz = quizData.quizzes.find(q => 
      currentTime >= q.timestamp && 
      currentTime < q.timestamp + 1
    );

    if (quiz) {
      console.log('Quiz encontrado no timestamp:', quiz.timestamp);
      console.log('Pergunta:', quiz.question);
      lastQuizTimestamp.current = currentTime;
      setCurrentQuiz(quiz);
      setShowQuiz(true);
      player.pauseVideo();
    }
  };

  const handleAnswer = (selectedIndex) => {
    console.log('Resposta selecionada:', selectedIndex);
    setAnswer(selectedIndex);
    const isCorrect = selectedIndex === currentQuiz.correctAnswer;
    console.log('Resposta está:', isCorrect ? 'correta' : 'incorreto');
    setFeedback(isCorrect ? 'correta' : 'incorreto');

    setTimeout(() => {
      console.log('Continuando vídeo após resposta...');
      setShowQuiz(false);
      setAnswer(null);
      setFeedback(null);
      if (player) {
        player.playVideo();
      }
    }, 2000);
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={`${styles.videoContainer} ${showQuiz ? styles.quizActive : ''}`}>
          <div id="youtube-player" className={styles.video} />
        </div>

        {showQuiz && (
          <>
            <div className={styles.overlay} />
            <div className={styles.quizContainer}>
              <h2 className={styles.question}>{currentQuiz.question}</h2>
              <div className={styles.options}>
                {currentQuiz.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    disabled={answer !== null}
                    className={`${styles.option} ${
                      answer === index
                        ? feedback === 'correta'
                          ? styles.correct
                          : styles.incorrect
                        : ''
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
