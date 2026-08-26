import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { RequireAuth, RequireStaff } from './components/RequireAuth';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LevelLessons from './pages/LevelLessons';
import LessonHome from './pages/LessonHome';
import SlideViewer from './pages/SlideViewer';
import Vocabulary from './pages/Vocabulary';
import Flashcards from './pages/Flashcards';
import Grammar from './pages/Grammar';
import Games from './pages/Games';
import MatchGame from './pages/games/MatchGame';
import ArrangeGame from './pages/games/ArrangeGame';
import QuizGame from './pages/games/QuizGame';
import ListenGame from './pages/games/ListenGame';
import MemoryGame from './pages/games/MemoryGame';
import BuildSentenceGame from './pages/games/BuildSentenceGame';
import Reading from './pages/Reading';
import Listening from './pages/Listening';
import Shadowing from './pages/Shadowing';
import Translate from './pages/Translate';
import VideoLearning from './pages/VideoLearning';
import LessonResult from './pages/LessonResult';
import Review from './pages/Review';

import AdminLayout from './pages/admin/AdminLayout';
import AdminLevels from './pages/admin/AdminLevels';
import AdminLessons from './pages/admin/AdminLessons';
import AdminWords from './pages/admin/AdminWords';
import AdminGrammar from './pages/admin/AdminGrammar';
import AdminSentences from './pages/admin/AdminSentences';
import AdminSlides from './pages/admin/AdminSlides';
import AdminSongs from './pages/admin/AdminSongs';
import AdminVideos from './pages/admin/AdminVideos';
import AdminUsers from './pages/admin/AdminUsers';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/review" element={<Review />} />
          <Route path="/levels/:levelId" element={<LevelLessons />} />
          <Route path="/lessons/:lessonId" element={<LessonHome />} />
          <Route path="/lessons/:lessonId/ppt" element={<SlideViewer />} />
          <Route path="/lessons/:lessonId/vocab" element={<Vocabulary />} />
          <Route path="/lessons/:lessonId/flashcards" element={<Flashcards />} />
          <Route path="/lessons/:lessonId/grammar" element={<Grammar />} />
          <Route path="/lessons/:lessonId/games" element={<Games />} />
          <Route path="/lessons/:lessonId/games/match" element={<MatchGame />} />
          <Route path="/lessons/:lessonId/games/arrange" element={<ArrangeGame />} />
          <Route path="/lessons/:lessonId/games/quiz" element={<QuizGame />} />
          <Route path="/lessons/:lessonId/games/listen" element={<ListenGame />} />
          <Route path="/lessons/:lessonId/games/memory" element={<MemoryGame />} />
          <Route path="/lessons/:lessonId/games/build" element={<BuildSentenceGame />} />
          <Route path="/lessons/:lessonId/reading" element={<Reading />} />
          <Route path="/lessons/:lessonId/listening" element={<Listening />} />
          <Route path="/lessons/:lessonId/shadowing" element={<Shadowing />} />
          <Route path="/lessons/:lessonId/translate" element={<Translate />} />
          <Route path="/lessons/:lessonId/video" element={<VideoLearning />} />
          <Route path="/lessons/:lessonId/song" element={<Navigate to="video" replace />} />
          <Route path="/lessons/:lessonId/result" element={<LessonResult />} />
        </Route>

        <Route element={<RequireStaff />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="lessons" replace />} />
            <Route path="levels" element={<AdminLevels />} />
            <Route path="lessons" element={<AdminLessons />} />
            <Route path="words" element={<AdminWords />} />
            <Route path="grammar" element={<AdminGrammar />} />
            <Route path="sentences" element={<AdminSentences />} />
            <Route path="slides" element={<AdminSlides />} />
            <Route path="songs" element={<AdminSongs />} />
            <Route path="videos" element={<AdminVideos />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
