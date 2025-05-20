// src/App.jsx
import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// layouts & pages
import Header       from './components/Header'
import Slider       from './components/Slider'
import ProductList  from './components/ProductList'
import Footer       from './components/Footer'
import ChatWidget   from './components/ChatWidget'
import ChatPage     from './components/ChatPage'
import SearchOverlay from './components/SearchOverlay'

// auth
import Login        from './auth/Login'
import SignUp       from './auth/SignUp'

// admin
import Dashboard    from './admin/pages/Dashboard'
import Tickets      from './admin/pages/Tickets'
import NewTicket    from './admin/pages/NewTicket'

function ClientLayout() {
  const { showSearch, setShowSearch } = useSearchContext()

  return (
    <>
      <Header onSearchClick={() => setShowSearch(true)} />
      <SearchOverlay isOpen={showSearch} onClose={() => setShowSearch(false)} />
      <main>
        <Slider />
        <ProductList limit={3} heading="OUT NOW" />
      </main>
      <Footer />
      <ChatWidget />
    </>
  )
}

function CategoryLayout() {
  const { showSearch, setShowSearch } = useSearchContext()

  return (
    <>
      <Header onSearchClick={() => setShowSearch(true)} />
      <SearchOverlay isOpen={showSearch} onClose={() => setShowSearch(false)} />
      <main>
        <ProductList />
      </main>
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
      <main>
        <ProductList />
      </main>
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
      <main>
        <ProductList search />
      </main>
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

          {/* Full-page chat */}
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/:ticketId" element={<ChatPage />} />

          {/* Client storefront */}
          <Route path="/" element={<ClientLayout />} />
          <Route path="/all" element={<AllProductsPage />} />
          <Route path="/category/:category" element={<CategoryLayout />} />
          <Route path="/search" element={<SearchPage />} />

          {/* Admin area */}
          <Route path="/admin"             element={<Dashboard />} />
          <Route path="/admin/tickets"     element={<Tickets   />} />
          <Route path="/admin/tickets/new" element={<NewTicket />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </SearchContext.Provider>
  )
}
