import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { RequireAuth, RequireStaff } from './components/RequireAuth';
import { useAuth } from './context/AuthContext';

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
import Instructors from './pages/Instructors';

import AdminLayout from './pages/admin/AdminLayout';
import AdminHome from './pages/admin/AdminHome';
import AdminLevels from './pages/admin/AdminLevels';
import AdminLevelDetail from './pages/admin/AdminLevelDetail';
import AdminLessonEditor from './pages/admin/AdminLessonEditor';
import AdminInstructors from './pages/admin/AdminInstructors';
import AdminUsers from './pages/admin/AdminUsers';

/** Admin/giáo viên đăng nhập vào thẳng trang quản trị, không thấy dashboard học sinh. */
function RoleHome() {
  const { user } = useAuth();
  if (user.role === 'admin' || user.role === 'teacher') return <Navigate to="/admin" replace />;
  return <Dashboard />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route path="/" element={<RoleHome />} />
          <Route path="/review" element={<Review />} />
          <Route path="/instructors" element={<Instructors />} />
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
            <Route index element={<AdminHome />} />
            <Route path="levels" element={<AdminLevels />} />
            <Route path="levels/:levelId" element={<AdminLevelDetail />} />
            <Route path="levels/:levelId/lessons/:lessonId" element={<AdminLessonEditor />} />
            <Route path="instructors" element={<AdminInstructors />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
