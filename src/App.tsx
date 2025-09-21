import React, { useState, useCallback, useEffect } from 'react';
import { Copy, RefreshCw, Settings, Shield, Eye, EyeOff, History, Trash2, Star, Clock, Download, Globe } from 'lucide-react';
import MatrixRain from './components/MatrixRain';
import { SANSKRIT_WORDS, LANGUAGE_OPTIONS, SANSKRIT_SYMBOLS, SanskritWord } from './data/sanskritWords';

const SANSKRIT_CHARS = [
  'अ', 'आ', 'इ', 'ई', 'उ', 'ऊ', 'ऋ', 'ए', 'ओ', 'औ',
  'क', 'ख', 'ग', 'घ', 'च', 'छ', 'ज', 'झ', 'ट', 'ठ',
  'ड', 'ढ', 'त', 'थ', 'द', 'ध', 'न', 'प', 'फ', 'ब',
  'भ', 'म', 'य', 'र', 'ल', 'व', 'श', 'ष', 'स', 'ह'
];

const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

interface PasswordOptions {
  length: number;
  strength: number;
  language: string;
  useWords: boolean;
  useChars: boolean;
  useNumbers: boolean;
  useSymbols: boolean;
}

interface PasswordHistoryItem {
  id: string;
  password: string;
  meaning: string;
  timestamp: Date;
  strength: string;
  isFavorite: boolean;
  options: PasswordOptions;
}

function App() {
  const [password, setPassword] = useState('');
  const [meaning, setMeaning] = useState('');
  const [showPassword, setShowPassword] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [passwordHistory, setPasswordHistory] = useState<PasswordHistoryItem[]>([]);
  const [options, setOptions] = useState<PasswordOptions>({
    length: 12,
    strength: 2,
    language: 'en',
    useWords: true,
    useChars: true,
    useNumbers: true,
    useSymbols: false
  });

  // Load history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('sanskrit-password-history');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setPasswordHistory(parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })));
      } catch (error) {
        console.error('Error loading password history:', error);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (passwordHistory.length > 0) {
      localStorage.setItem('sanskrit-password-history', JSON.stringify(passwordHistory));
    }
  }, [passwordHistory]);

  const generatePassword = useCallback(() => {
    const passwordWords: string[] = [];
    let meaningCombined = "";

    // Generate words based on strength
    for (let i = 0; i < options.strength; i++) {
      const word = SANSKRIT_WORDS[Math.floor(Math.random() * SANSKRIT_WORDS.length)];
      passwordWords.push(word.sa);
      
      const translation = word[options.language as keyof SanskritWord] || word.en;
      meaningCombined += translation + (i < options.strength - 1 ? "\n" : "");
    }

    // Add symbol
    const symbol = SANSKRIT_SYMBOLS[Math.floor(Math.random() * SANSKRIT_SYMBOLS.length)];
    let result = passwordWords.join("") + symbol;

    // Add additional characters if needed
    if (options.useChars || options.useNumbers || options.useSymbols) {
      let charset = '';
      if (options.useChars) charset += SANSKRIT_CHARS.join('');
      if (options.useNumbers) charset += NUMBERS;
      if (options.useSymbols) charset += SYMBOLS;

      const remainingLength = Math.max(0, options.length - result.length);
      for (let i = 0; i < remainingLength; i++) {
        if (charset.length > 0) {
          result += charset.charAt(Math.floor(Math.random() * charset.length));
        }
      }
    }

    // Shuffle and trim to desired length
    const shuffled = result.split('').sort(() => 0.5 - Math.random()).join('');
    const finalPassword = shuffled.slice(0, Math.max(options.length, result.length));
    
    setPassword(finalPassword);
    setMeaning(meaningCombined);

    // Add to history
    const strength = getPasswordStrength(finalPassword);
    const historyItem: PasswordHistoryItem = {
      id: Date.now().toString(),
      password: finalPassword,
      meaning: meaningCombined,
      timestamp: new Date(),
      strength: strength?.text || 'Unknown',
      isFavorite: false,
      options: { ...options }
    };

    setPasswordHistory(prev => [historyItem, ...prev.slice(0, 49)]); // Keep last 50 passwords
  }, [options]);

  const copyToClipboard = async (text: string, includeMeaning: boolean = false) => {
    try {
      const copyText = includeMeaning ? `${text}\n${meaning}` : text;
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy password:', err);
    }
  };

  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(pwd)) score++;
    if (/[\u0900-\u097F]/.test(pwd)) score++; // Sanskrit/Devanagari characters
    
    if (score <= 2) return { text: 'Weak', color: 'text-red-400', bg: 'bg-red-900/20' };
    if (score <= 3) return { text: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-900/20' };
    return { text: 'Strong', color: 'text-green-400', bg: 'bg-green-900/20' };
  };

  const toggleFavorite = (id: string) => {
    setPasswordHistory(prev => 
      prev.map(item => 
        item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
      )
    );
  };

  const deleteFromHistory = (id: string) => {
    setPasswordHistory(prev => prev.filter(item => item.id !== id));
  };

  const clearHistory = () => {
    setPasswordHistory([]);
    localStorage.removeItem('sanskrit-password-history');
  };

  const usePasswordFromHistory = (historyPassword: string, historyMeaning: string, historyOptions: PasswordOptions) => {
    setPassword(historyPassword);
    setMeaning(historyMeaning);
    setOptions(historyOptions);
    setShowHistory(false);
  };

  const exportHistory = () => {
    const dataStr = JSON.stringify(passwordHistory, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sanskrit-password-history.json';
    link.click();
  };

  const downloadPNG = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 800;
    const height = 400;
    canvas.width = width;
    canvas.height = height;

    // Background
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);

    // Title
    ctx.fillStyle = "#ffdf5e";
    ctx.font = "24px 'Noto Sans Devanagari', sans-serif";
    ctx.fillText("संस्कृत पासवर्ड जनरेटर", 50, 50);

    // Password
    ctx.fillStyle = "#fff";
    ctx.font = "32px 'Noto Sans Devanagari', monospace";
    const lines = password.match(/.{1,20}/g) || [password];
    lines.forEach((line, i) => {
      ctx.fillText(line, 50, 120 + i * 40);
    });

    // Meaning
    ctx.fillStyle = "#ccc";
    ctx.font = "18px 'Noto Sans Devanagari', sans-serif";
    const meaningLines = meaning.split('\n');
    meaningLines.forEach((line, i) => {
      ctx.fillText(line, 50, 220 + i * 30);
    });

    // Download
    const link = document.createElement("a");
    link.download = "sanskrit-password.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const strength = password ? getPasswordStrength(password) : null;
  const favoritePasswords = passwordHistory.filter(item => item.isFavorite);
  const selectedLanguage = LANGUAGE_OPTIONS.find(lang => lang.value === options.language);

  React.useEffect(() => {
    generatePassword();
  }, [generatePassword]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Matrix Rain Background */}
      <MatrixRain />
      
      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-green-400 mr-3" />
            <h1 className="text-4xl font-bold text-white">संस्कृत पासवर्ड जनरेटर</h1>
          </div>
          <p className="text-green-300 text-lg">Ancient wisdom meets modern security</p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Password Generator */}
            <div className="lg:col-span-2">
              {/* Password Display */}
              <div className="bg-black/70 backdrop-blur-sm rounded-2xl border border-green-500/30 shadow-2xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white">Generated Password</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-2 text-green-400 hover:text-green-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className="p-2 text-green-400 hover:text-green-300 transition-colors"
                    >
                      <History className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="bg-gray-900/50 rounded-lg p-4 font-mono text-xl break-all border border-green-500/20 text-green-300">
                    {showPassword ? password || 'Click Generate to create password...' : '••••••••••••••••'}
                  </div>
                  
                  {/* Meaning Display */}
                  {meaning && (
                    <div className="mt-4 bg-gray-900/30 rounded-lg p-4 border border-green-500/20">
                      <h3 className="text-sm font-medium text-green-400 mb-2">Meaning:</h3>
                      <div className="text-white whitespace-pre-line">{meaning}</div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={generatePassword}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Generate
                      </button>
                      
                      <button
                        onClick={() => copyToClipboard(password)}
                        disabled={!password}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Copy className="w-4 h-4" />
                        {copied ? 'Copied!' : 'Copy'}
                      </button>

                      <button
                        onClick={downloadPNG}
                        disabled={!password}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Download className="w-4 h-4" />
                        PNG
                      </button>
                    </div>
                    
                    {strength && (
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${strength.bg} ${strength.color} border border-current/20`}>
                        {strength.text}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="bg-black/70 backdrop-blur-sm rounded-2xl border border-green-500/30 shadow-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Settings className="w-5 h-5 text-green-400" />
                  <h3 className="text-xl font-semibold text-white">Password Options</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Password Strength */}
                  <div>
                    <label className="block text-sm font-medium text-green-300 mb-2">
                      Password Strength: {options.strength} word{options.strength !== 1 ? 's' : ''}
                    </label>
                    <select
                      value={options.strength}
                      onChange={(e) => setOptions(prev => ({ ...prev, strength: parseInt(e.target.value) }))}
                      className="w-full bg-gray-900/50 border border-green-500/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-400"
                    >
                      <option value={1}>संक्षिप्त (Short - 1 word)</option>
                      <option value={2}>मध्यम (Medium - 2 words)</option>
                      <option value={3}>सशक्त (Strong - 3 words)</option>
                    </select>
                  </div>

                  {/* Language Selection */}
                  <div>
                    <label className="block text-sm font-medium text-green-300 mb-2">
                      <Globe className="w-4 h-4 inline mr-1" />
                      Meaning Language: {selectedLanguage?.flag}
                    </label>
                    <select
                      value={options.language}
                      onChange={(e) => setOptions(prev => ({ ...prev, language: e.target.value }))}
                      className="w-full bg-gray-900/50 border border-green-500/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-400"
                    >
                      {LANGUAGE_OPTIONS.map(lang => (
                        <option key={lang.value} value={lang.value}>
                          {lang.flag} {lang.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Length Slider */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-green-300 mb-2">
                    Minimum Length: {options.length}
                  </label>
                  <input
                    type="range"
                    min="8"
                    max="64"
                    value={options.length}
                    onChange={(e) => setOptions(prev => ({ ...prev, length: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-green-300 mt-1">
                    <span>8</span>
                    <span>64</span>
                  </div>
                </div>

                {/* Character Options */}
                <div className="grid grid-cols-2 gap-3 mt-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.useWords}
                      onChange={(e) => setOptions(prev => ({ ...prev, useWords: e.target.checked }))}
                      className="w-4 h-4 text-green-600 bg-gray-800 border-gray-600 rounded focus:ring-green-500"
                    />
                    <span className="text-green-200">Sanskrit Words (शब्द)</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.useChars}
                      onChange={(e) => setOptions(prev => ({ ...prev, useChars: e.target.checked }))}
                      className="w-4 h-4 text-green-600 bg-gray-800 border-gray-600 rounded focus:ring-green-500"
                    />
                    <span className="text-green-200">Sanskrit Characters (अक्षर)</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.useNumbers}
                      onChange={(e) => setOptions(prev => ({ ...prev, useNumbers: e.target.checked }))}
                      className="w-4 h-4 text-green-600 bg-gray-800 border-gray-600 rounded focus:ring-green-500"
                    />
                    <span className="text-green-200">Numbers (0-9)</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.useSymbols}
                      onChange={(e) => setOptions(prev => ({ ...prev, useSymbols: e.target.checked }))}
                      className="w-4 h-4 text-green-600 bg-gray-800 border-gray-600 rounded focus:ring-green-500"
                    />
                    <span className="text-green-200">Symbols (!@#$%)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* History Panel */}
            <div className={`${showHistory ? 'block' : 'hidden lg:block'}`}>
              <div className="bg-black/70 backdrop-blur-sm rounded-2xl border border-green-500/30 shadow-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-green-400" />
                    <h3 className="text-lg font-semibold text-white">Password History</h3>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={exportHistory}
                      disabled={passwordHistory.length === 0}
                      className="p-1 text-green-400 hover:text-green-300 transition-colors disabled:opacity-30"
                      title="Export History"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={clearHistory}
                      disabled={passwordHistory.length === 0}
                      className="p-1 text-red-400 hover:text-red-300 transition-colors disabled:opacity-30"
                      title="Clear History"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                  <div className="bg-gray-900/50 rounded-lg p-2 text-center border border-green-500/20">
                    <div className="font-semibold text-white">{passwordHistory.length}</div>
                    <div className="text-green-300">Total</div>
                  </div>
                  <div className="bg-yellow-900/20 rounded-lg p-2 text-center border border-yellow-500/20">
                    <div className="font-semibold text-yellow-300">{favoritePasswords.length}</div>
                    <div className="text-yellow-400">Favorites</div>
                  </div>
                </div>

                {/* Favorites Section */}
                {favoritePasswords.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-green-300 mb-2 flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400" />
                      Favorites
                    </h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {favoritePasswords.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          className="bg-yellow-900/20 border border-yellow-500/20 rounded-lg p-2 cursor-pointer hover:bg-yellow-900/30 transition-colors"
                          onClick={() => usePasswordFromHistory(item.password, item.meaning, item.options)}
                        >
                          <div className="font-mono text-sm truncate text-yellow-200">{item.password}</div>
                          <div className="text-xs text-yellow-400 mt-1">
                            {item.strength} • {item.timestamp.toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent History */}
                <div>
                  <h4 className="text-sm font-medium text-green-300 mb-2 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-green-400" />
                    Recent
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {passwordHistory.length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-4">No passwords generated yet</p>
                    ) : (
                      passwordHistory.slice(0, 10).map((item) => {
                        const strength = getPasswordStrength(item.password);
                        return (
                          <div
                            key={item.id}
                            className="bg-gray-900/50 border border-green-500/20 rounded-lg p-3 group hover:bg-gray-900/70 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div 
                                className="flex-1 cursor-pointer"
                                onClick={() => usePasswordFromHistory(item.password, item.meaning, item.options)}
                              >
                                <div className="font-mono text-sm break-all text-green-200">{item.password}</div>
                                <div className="text-xs text-gray-400 mt-1 whitespace-pre-line">{item.meaning}</div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-xs px-2 py-1 rounded ${strength?.bg} ${strength?.color}`}>
                                    {item.strength}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {item.timestamp.toLocaleTimeString()}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => toggleFavorite(item.id)}
                                  className={`p-1 transition-colors ${
                                    item.isFavorite 
                                      ? 'text-yellow-400 hover:text-yellow-300' 
                                      : 'text-gray-500 hover:text-yellow-400'
                                  }`}
                                >
                                  <Star className="w-3 h-3" fill={item.isFavorite ? 'currentColor' : 'none'} />
                                </button>
                                <button
                                  onClick={() => copyToClipboard(item.password)}
                                  className="p-1 text-gray-500 hover:text-green-400 transition-colors"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => deleteFromHistory(item.id)}
                                  className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-green-300">
            <p>🕉️ Ancient Sanskrit wisdom meets cutting-edge security 🕉️</p>
            <p className="mt-1">Multi-language meanings • Matrix animation • Secure password generation</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
