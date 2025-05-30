// src/App.jsx
import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// layouts & pages
import Header       from './components/Header'
import Slider       from './components/Slider'
import GucciHero    from './components/VideoHero'
import ProductList  from './components/ProductList'
import Footer       from './components/Footer'
import ChatWidget   from './components/ChatWidget'
import ChatPage     from './components/ChatPage'
import SearchOverlay from './components/SearchOverlay'

// auth
import Login        from './auth/Login'
import SignUp       from './auth/SignUp'
import Reset        from './auth/Reset'
import Profile      from './auth/Profile'
import Dashboard    from './auth/Dashboard'

// admin
import AdminDashboard from './admin/pages/Dashboard'
import Tickets      from './admin/pages/Tickets'
import TicketDetails from './admin/pages/TicketDetails'
import Agents       from './admin/pages/Agents'
import Analytics    from './admin/pages/Analytics'
import Settings     from './admin/pages/Settings'

function ClientLayout() {
  const { showSearch, setShowSearch } = useSearchContext()

  return (
    <div className="flex flex-col min-h-screen">
      <Header onSearchClick={() => setShowSearch(true)} />
      <SearchOverlay isOpen={showSearch} onClose={() => setShowSearch(false)} />
      <GucciHero />
      <main className="flex-grow">
        <div className="content-container">
          <Slider />
          <ProductList limit={3} heading="OUT NOW" />
        </div>
      </main>
      <Footer />
      <ChatWidget />
    </div>
  )
}

function CategoryLayout() {
  const { showSearch, setShowSearch } = useSearchContext()

  return (
    <>
      <Header onSearchClick={() => setShowSearch(true)} />
      <SearchOverlay isOpen={showSearch} onClose={() => setShowSearch(false)} />
      <div style={{
        backgroundImage: "url(/src/assets/background-scaled.png)",
        backgroundRepeat: "repeat",
        backgroundSize: "700px"
      }}>
        <main className="pt-36">
          <ProductList />
        </main>
      </div>
      <Footer />
      <ChatWidget />
    </>
  )
}

function AllProductsPage() {
  const { showSearch, setShowSearch } = useSearchContext()

  return (
    <>
      <Header onSearchClick={() => setShowSearch(true)} />
      <SearchOverlay isOpen={showSearch} onClose={() => setShowSearch(false)} />
      <div style={{
        backgroundImage: "url(/src/assets/background-scaled.png)",
        backgroundRepeat: "repeat",
        backgroundSize: "700px"
      }}>
        <main className="pt-36">
          <ProductList />
        </main>
      </div>
      <Footer />
      <ChatWidget />
    </>
  )
}

function SearchPage() {
  const { showSearch, setShowSearch } = useSearchContext()

  return (
    <>
      <Header onSearchClick={() => setShowSearch(true)} />
      <SearchOverlay isOpen={showSearch} onClose={() => setShowSearch(false)} />
      <div style={{
        backgroundImage: "url(/src/assets/background-scaled.png)",
        backgroundRepeat: "repeat",
        backgroundSize: "700px"
      }}>
        <main className="pt-36">
          <ProductList search />
        </main>
      </div>
      <Footer />
      <ChatWidget />
    </>
  )
}

// Create a context for the search state
const SearchContext = React.createContext({
  showSearch: false,
  setShowSearch: () => {},
})

export const useSearchContext = () => React.useContext(SearchContext)

export default function App() {
  const [showSearch, setShowSearch] = useState(false) 

  // Automatically close search when user navigates
  useEffect(() => {
    const handlePopState = () => {
      setShowSearch(false)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  return (
    <SearchContext.Provider value={{ showSearch, setShowSearch }}>
      <BrowserRouter>
        <Routes>
          {/* Public auth */}
          <Route path="/login"  element={<Login  />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/reset"  element={<Reset />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Full-page chat */}
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/:ticketId" element={<ChatPage />} />

          {/* Client storefront */}
          <Route path="/" element={<ClientLayout />} />
          <Route path="/all" element={<AllProductsPage />} />
          <Route path="/category/:category" element={<CategoryLayout />} />
          <Route path="/search" element={<SearchPage />} />

          {/* Admin area */}
          <Route path="/admin"             element={<AdminDashboard />} />
          <Route path="/admin/tickets"     element={<Tickets   />} />
          <Route path="/admin/tickets/:id" element={<TicketDetails />} />
          <Route path="/admin/agents"      element={<Agents />} />
          <Route path="/admin/analytics"   element={<Analytics />} />
          <Route path="/admin/settings"    element={<Settings />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </SearchContext.Provider>
  )
}
