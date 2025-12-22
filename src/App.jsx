import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/login";
import Home from "./pages/home";
import ProtectedRoute from "./ProtectedRoute";
import CreateWarehouse from "./pages/createwarehouse";
import WarehousePage from "./pages/warehouse";
import Addbatches from "./pages/addBatches";
import Creatproduct from "./pages/creatProduct";
import Createsensor from "./pages/creatSensor";
import Alerts from "./pages/alerts";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route path="alerts" element={
          <ProtectedRoute>
            <Alerts/>
          </ProtectedRoute>
        } />
        <Route
          path="/create-warehouse"
          element={
            <ProtectedRoute>
              <CreateWarehouse />
            </ProtectedRoute>
          }
        />
        <Route path="/add-batch" element={
          <ProtectedRoute>
            <Addbatches/>
          </ProtectedRoute>
        } />
        <Route path="/create-product" element={
          <ProtectedRoute>
            <Creatproduct/>
          </ProtectedRoute>
        } />
        <Route path="/create-sensor" element={
          <ProtectedRoute>
            <Createsensor/>
          </ProtectedRoute>
        } />
        <Route
          path="/warehouse"
          element={
            <ProtectedRoute>
              <WarehousePage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
export default App;
