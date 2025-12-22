import { Route, Routes, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import ProblemLibrary from "./components/ProblemLibrary";
import FlashcardReview from "./components/FlashcardReview";
import AddProblem from "./components/AddProblem";
import EditProblem from "./components/EditProblem";

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/review" replace />} />
        <Route path="/review" element={<FlashcardReview />} />
        <Route path="/problems" element={<ProblemLibrary />} />
        <Route path="/problems/new" element={<AddProblem />} />
        <Route path="/problems/:id/edit" element={<EditProblem />} />
        {/* Backwards compatibility if any /dashboard link exists */}
        <Route path="/dashboard" element={<Navigate to="/review" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;


