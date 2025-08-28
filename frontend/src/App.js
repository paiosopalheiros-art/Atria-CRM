import { useEffect, useState } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./components/ui/table";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [statusChecks, setStatusChecks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiHealth, setApiHealth] = useState(null);

  const fetchApiHealth = async () => {
    try {
      const response = await axios.get(`${API}/health`);
      setApiHealth(response.data);
      console.log("✅ API Health:", response.data);
    } catch (e) {
      console.error("❌ API Health Error:", e);
      setApiHealth({ status: "error", error: e.message });
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/stats`);
      setStats(response.data);
      console.log("📊 Stats:", response.data);
    } catch (e) {
      console.error("❌ Stats Error:", e);
    }
  };

  const fetchStatusChecks = async () => {
    try {
      const response = await axios.get(`${API}/status?limit=10`);
      setStatusChecks(response.data);
      console.log("📋 Status Checks:", response.data);
    } catch (e) {
      console.error("❌ Status Checks Error:", e);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/users`);
      setUsers(response.data);
      console.log("👥 Users:", response.data);
    } catch (e) {
      console.error("❌ Users Error:", e);
    }
  };

  const createTestUser = async () => {
    try {
      const testUser = {
        name: `Usuário Teste ${Date.now()}`,
        email: `teste${Date.now()}@example.com`,
        platform: "web"
      };
      const response = await axios.post(`${API}/users`, testUser);
      console.log("✅ Usuário criado:", response.data);
      fetchUsers(); // Refresh users list
      fetchStats(); // Refresh stats
    } catch (e) {
      console.error("❌ Erro ao criar usuário:", e);
    }
  };

  const createStatusCheck = async () => {
    try {
      const statusCheck = {
        client_name: `Cliente ${Date.now()}`,
        platform: "web",
        version: "1.0.0"
      };
      const response = await axios.post(`${API}/status`, statusCheck);
      console.log("✅ Status check criado:", response.data);
      fetchStatusChecks(); // Refresh status checks
      fetchStats(); // Refresh stats
    } catch (e) {
      console.error("❌ Erro ao criar status check:", e);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchApiHealth(),
        fetchStats(),
        fetchStatusChecks(),
        fetchUsers()
      ]);
      setLoading(false);
    };

    loadData();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard Web-Mobile</h1>
              <p className="text-gray-600 mt-1">Sistema de gestão e comunicação com app móvel</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${apiHealth?.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {apiHealth?.status === 'healthy' ? 'API Conectada' : 'API com Problemas'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Usuários</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_users}</div>
                <p className="text-xs text-gray-500 mt-1">Todos os usuários</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Sessões Ativas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.active_sessions}</div>
                <p className="text-xs text-gray-500 mt-1">Usuários online</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Usuários Web</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.web_users}</div>
                <p className="text-xs text-gray-500 mt-1">Plataforma web</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Usuários Mobile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{stats.mobile_users}</div>
                <p className="text-xs text-gray-500 mt-1">Aplicativo móvel</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Status Checks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_status_checks}</div>
                <p className="text-xs text-gray-500 mt-1">Total de verificações</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button onClick={createTestUser} className="bg-blue-600 hover:bg-blue-700">
            Criar Usuário Teste
          </Button>
          <Button onClick={createStatusCheck} variant="outline">
            Criar Status Check
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Status Checks */}
          <Card>
            <CardHeader>
              <CardTitle>Status Checks Recentes</CardTitle>
              <CardDescription>Últimas verificações do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Plataforma</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statusChecks.slice(0, 5).map((check) => (
                    <TableRow key={check.id}>
                      <TableCell className="font-medium">{check.client_name}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          check.platform === 'web' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {check.platform}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">{formatDate(check.timestamp)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Users List */}
          <Card>
            <CardHeader>
              <CardTitle>Usuários Recentes</CardTitle>
              <CardDescription>Lista de usuários do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Plataforma</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.slice(0, 5).map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell className="text-sm text-gray-500">{user.email}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          user.platform === 'web' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {user.platform}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
