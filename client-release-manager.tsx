import React, { createContext, useContext, useState, useEffect } from 'react';

// Types
interface Release {
  branch: string;
  version: string;
  build: number;
  date: string;
}

interface ClientData {
  [environment: string]: Release;
}

interface ReleasesData {
  [client: string]: ClientData;
}

interface TableRow {
  key: string;
  client: string;
  env: string;
  branch: string;
  version: string;
  build: number;
  date: string;
}

interface User {
  email: string;
  password: string;
  releases: ReleasesData;
}

interface AuthContextType {
  currentUser: string | null;
  login: (email: string, password: string) => boolean;
  signup: (email: string, password: string) => boolean;
  logout: () => void;
}

interface ReleasesContextType {
  releases: ReleasesData;
  addRelease: (client: string, env: string, release: Release) => void;
  updateRelease: (client: string, env: string, release: Release) => void;
  deleteRelease: (client: string, env: string) => void;
  exportData: () => void;
}

// Auth Context
const AuthContext = createContext<AuthContextType | null>(null);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    return localStorage.getItem('currentUser');
  });

  const getAllUsers = (): Record<string, User> => {
    const users = localStorage.getItem('users');
    return users ? JSON.parse(users) : {};
  };

  const saveUsers = (users: Record<string, User>) => {
    localStorage.setItem('users', JSON.stringify(users));
  };

  const signup = (email: string, password: string): boolean => {
    const users = getAllUsers();
    if (users[email]) {
      return false;
    }
    users[email] = {
      email,
      password,
      releases: {}
    };
    saveUsers(users);
    return true;
  };

  const login = (email: string, password: string): boolean => {
    const users = getAllUsers();
    const user = users[email];
    if (user && user.password === password) {
      setCurrentUser(email);
      localStorage.setItem('currentUser', email);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Releases Context
const ReleasesContext = createContext<ReleasesContextType | null>(null);

const useReleases = () => {
  const context = useContext(ReleasesContext);
  if (!context) throw new Error('useReleases must be used within ReleasesProvider');
  return context;
};

const ReleasesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [releases, setReleases] = useState<ReleasesData>({});

  useEffect(() => {
    if (currentUser) {
      const users = localStorage.getItem('users');
      if (users) {
        const allUsers = JSON.parse(users);
        setReleases(allUsers[currentUser]?.releases || {});
      }
    }
  }, [currentUser]);

  const saveReleases = (newReleases: ReleasesData) => {
    if (!currentUser) return;
    const users = localStorage.getItem('users');
    if (users) {
      const allUsers = JSON.parse(users);
      allUsers[currentUser].releases = newReleases;
      localStorage.setItem('users', JSON.stringify(allUsers));
    }
  };

  const addRelease = (client: string, env: string, release: Release) => {
    const newReleases = {
      ...releases,
      [client]: {
        ...releases[client],
        [env]: release
      }
    };
    setReleases(newReleases);
    saveReleases(newReleases);
  };

  const updateRelease = (client: string, env: string, release: Release) => {
    const newReleases = {
      ...releases,
      [client]: {
        ...releases[client],
        [env]: release
      }
    };
    setReleases(newReleases);
    saveReleases(newReleases);
  };

  const deleteRelease = (client: string, env: string) => {
    const newReleases = { ...releases };
    delete newReleases[client][env];
    if (Object.keys(newReleases[client]).length === 0) {
      delete newReleases[client];
    }
    setReleases(newReleases);
    saveReleases(newReleases);
  };

  const exportData = () => {
    const dataStr = JSON.stringify(releases, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `releases-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ReleasesContext.Provider value={{ releases, addRelease, updateRelease, deleteRelease, exportData }}>
      {children}
    </ReleasesContext.Provider>
  );
};

// Icons
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);

const DeleteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"></circle>
    <path d="m21 21-4.35-4.35"></path>
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

// Auth Screen Component
const AuthScreen: React.FC = () => {
  const { login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (isLogin) {
      const success = login(email, password);
      if (!success) {
        setError('Invalid email or password');
      }
    } else {
      const success = signup(email, password);
      if (!success) {
        setError('Email already exists');
      } else {
        login(email, password);
      }
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    border: '1px solid #d9d9d9',
    fontSize: '14px',
    outline: 'none',
    marginBottom: '16px'
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        border: '1px solid #000',
        padding: '40px'
      }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: 300,
          marginBottom: '8px',
          textAlign: 'center'
        }}>
          Client Release Manager
        </h1>
        <p style={{
          color: '#666',
          fontSize: '14px',
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          {isLogin ? 'Sign in to your account' : 'Create a new account'}
        </p>

        {error && (
          <div style={{
            padding: '12px',
            backgroundColor: '#f5f5f5',
            border: '1px solid #000',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 500 }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            placeholder="Enter your email"
            style={inputStyle}
          />

          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 500 }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            placeholder="Enter your password"
            style={inputStyle}
          />

          <button
            onClick={handleSubmit}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#000',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              marginBottom: '16px'
            }}
          >
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>

          <div style={{ textAlign: 'center' }}>
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#666',
                cursor: 'pointer',
                fontSize: '14px',
                textDecoration: 'underline'
              }}
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal Component
const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#fff',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflowY: 'auto',
        border: '1px solid #000'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: '1px solid #000'
        }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 400 }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <CloseIcon />
          </button>
        </div>
        <div style={{ padding: '24px' }}>{children}</div>
      </div>
    </div>
  );
};

// Release Form Component
const ReleaseForm: React.FC<{
  initialData?: { client: string; env: string; release: Release };
  onSubmit: (client: string, env: string, release: Release) => void;
  onCancel: () => void;
}> = ({ initialData, onSubmit, onCancel }) => {
  const [client, setClient] = useState(initialData?.client || '');
  const [env, setEnvironment] = useState(initialData?.env || '');
  const [branch, setBranch] = useState(initialData?.release.branch || '');
  const [version, setVersion] = useState(initialData?.release.version || '');
  const [build, setBuild] = useState(initialData?.release.build.toString() || '1');
  const [date, setDate] = useState(initialData?.release.date || new Date().toISOString().split('T')[0]);

  const handleSubmit = () => {
    if (!client || !env || !branch || !version) return;
    onSubmit(client.toLowerCase().trim(), env.toLowerCase().trim(), {
      branch,
      version,
      build: parseInt(build),
      date
    });
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d9d9d9',
    fontSize: '14px',
    outline: 'none'
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '4px',
    fontSize: '14px',
    fontWeight: 500
  };

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Client Name</label>
        <input
          type="text"
          value={client}
          onChange={(e) => setClient(e.target.value)}
          placeholder="Enter client name"
          disabled={!!initialData}
          style={inputStyle}
        />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Environment</label>
        <input
          type="text"
          value={env}
          onChange={(e) => setEnvironment(e.target.value)}
          placeholder="dev, uat, prod, hotfix"
          disabled={!!initialData}
          style={inputStyle}
        />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Branch</label>
        <input
          type="text"
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          placeholder="client/environment"
          style={inputStyle}
        />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Version</label>
        <input
          type="text"
          value={version}
          onChange={(e) => setVersion(e.target.value)}
          placeholder="2.1.0"
          style={inputStyle}
        />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Build Number</label>
        <input
          type="number"
          value={build}
          onChange={(e) => setBuild(e.target.value)}
          min="1"
          style={inputStyle}
        />
      </div>
      <div style={{ marginBottom: '24px' }}>
        <label style={labelStyle}>Release Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={inputStyle}
        />
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleSubmit}
          style={{
            flex: 1,
            padding: '8px 16px',
            backgroundColor: '#000',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          {initialData ? 'Update' : 'Add'} Release
        </button>
        <button
          onClick={onCancel}
          style={{
            flex: 1,
            padding: '8px 16px',
            backgroundColor: '#fff',
            color: '#000',
            border: '1px solid #000',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// Dashboard Component
const Dashboard: React.FC = () => {
  const { releases, addRelease, updateRelease, deleteRelease, exportData } = useReleases();
  const { currentUser, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState<{ client: string; env: string; release: Release } | null>(null);

  const handleAdd = (client: string, env: string, release: Release) => {
    addRelease(client, env, release);
    setIsModalOpen(false);
  };

  const handleEdit = (client: string, env: string, release: Release) => {
    updateRelease(client, env, release);
    setEditData(null);
  };

  const handleDelete = (client: string, env: string) => {
    if (window.confirm(`Delete ${client}/${env}?`)) {
      deleteRelease(client, env);
    }
  };

  const tableData: TableRow[] = Object.entries(releases).flatMap(([client, environments]) =>
    Object.entries(environments).map(([env, release]) => ({
      key: `${client}-${env}`,
      client,
      env,
      ...release,
    }))
  );

  tableData.sort((a, b) => a.client.localeCompare(b.client));

  const filteredData = tableData.filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.client.toLowerCase().includes(term) ||
      item.env.toLowerCase().includes(term) ||
      item.branch.toLowerCase().includes(term) ||
      item.version.toLowerCase().includes(term)
    );
  });

  const groupedData = new Map<string, TableRow[]>();
  filteredData.forEach((item) => {
    if (!groupedData.has(item.client)) {
      groupedData.set(item.client, []);
    }
    groupedData.get(item.client)!.push(item);
  });

  const buttonStyle: React.CSSProperties = {
    padding: '8px 16px',
    backgroundColor: '#fff',
    color: '#000',
    border: '1px solid #000',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px'
  };

  const iconButtonStyle: React.CSSProperties = {
    padding: '6px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center'
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fff', padding: '40px 24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 300, marginBottom: '8px', margin: 0 }}>
              Client Release Manager
            </h1>
            <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>
              Manage releases across clients and environments
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>
              {currentUser}
            </p>
            <button onClick={logout} style={buttonStyle}>
              <LogoutIcon /> Logout
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ position: 'relative', width: '350px' }}>
            <input
              type="text"
              placeholder="Search clients, branches, versions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                border: '1px solid #d9d9d9',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <SearchIcon />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setIsModalOpen(true)} style={buttonStyle}>
              <PlusIcon /> Add Release
            </button>
            <button onClick={exportData} style={buttonStyle}>
              <DownloadIcon /> Export
            </button>
          </div>
        </div>

        {Array.from(groupedData.entries()).map(([client, items]) => (
          <div key={client} style={{ border: '1px solid #000', backgroundColor: '#fff', marginBottom: '24px' }}>
            <div style={{ backgroundColor: '#000', color: '#fff', padding: '12px 16px' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1px' }}>
                {client}
              </h2>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '1px solid #e8e8e8' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase' }}>Environment</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase' }}>Branch</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase' }}>Version</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase' }}>Build</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase' }}>Date</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.key} style={{ borderBottom: '1px solid #e8e8e8' }}>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        border: '1px solid #000',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        backgroundColor: item.env === 'prod' ? '#000' : '#fff',
                        color: item.env === 'prod' ? '#fff' : '#000'
                      }}>
                        {item.env}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', fontFamily: 'monospace' }}>
                      {item.branch}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500 }}>
                      {item.version}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                      #{item.build}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#666' }}>
                      {item.date}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => setEditData({
                            client: item.client,
                            env: item.env,
                            release: { branch: item.branch, version: item.version, build: item.build, date: item.date }
                          })}
                          style={iconButtonStyle}
                        >
                          <EditIcon />
                        </button>
                        <button
                          onClick={() => handleDelete(item.client, item.env)}
                          style={iconButtonStyle}
                        >
                          <DeleteIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        {filteredData.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', color: '#999', border: '1px solid #e8e8e8' }}>
            No releases found. Add your first release to get started.
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Release">
        <ReleaseForm onSubmit={handleAdd} onCancel={() => setIsModalOpen(false)} />
      </Modal>

      {editData && (
        <Modal isOpen={!!editData} onClose={() => setEditData(null)} title="Edit Release">
          <ReleaseForm
            initialData={editData}
            onSubmit={handleEdit}
            onCancel={() => setEditData(null)}
          />
        </Modal>
      )}
    </div>
  );
};

// Main App
const App: React.FC = () => {
  return (
    <AuthProvider>
      <ReleasesProvider>
        <AppContent />
      </ReleasesProvider>
    </AuthProvider>
  );
};

const AppContent: React.FC = () => {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return <AuthScreen />;
  }
  
  return <Dashboard />;
};

export default App;