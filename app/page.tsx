"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Sparkles, ExternalLink, Users, Star, ChevronRight } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface ModResult {
  id: number
  title: string
  authors: string[]
  categories: string[]
  description: string
  popularityRank: number
  websiteUrl: string
}

interface SearchResponse {
  query: string
  results: ModResult[]
}

interface AutocompleteResponse {
  query: string
  suggestions: string[]
}

interface SummaryResponse {
  mod_id: string
  title: string
  summary: string
}

export default function MinecraftModsSearch() {
  const [query, setQuery] = useState("")
  const [searchResults, setSearchResults] = useState<ModResult[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize] = useState(10)
  const [hasMoreResults, setHasMoreResults] = useState(false)
  const [selectedSummary, setSelectedSummary] = useState<SummaryResponse | null>(null)
  const [isLoadingSummary, setIsLoadingSummary] = useState(false)
  const [useAdvancedAutocomplete, setUseAdvancedAutocomplete] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const debounceTimer = useRef<NodeJS.Timeout>()
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Debounced autocomplete
  const fetchSuggestions = useCallback(
    async (searchTerm: string) => {
      if (!searchTerm.trim()) {
        setSuggestions([])
        setShowSuggestions(false)
        return
      }

      try {
        const endpoint = useAdvancedAutocomplete ? "sayt" : "suggester"
        const response = await fetch(
          `http://localhost:8001/autocomplete/${endpoint}/?q=${encodeURIComponent(searchTerm)}&size=5`,
        )
        const data: AutocompleteResponse = await response.json()
        setSuggestions(data.suggestions)
        setShowSuggestions(true)
      } catch (error) {
        console.error("Error fetching suggestions:", error)
        setSuggestions([])
        setShowSuggestions(false)
      }
    },
    [useAdvancedAutocomplete],
  )

  // Handle input change with debouncing
  const handleInputChange = (value: string) => {
    setQuery(value)

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    // Set new timer for 5 seconds
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(value)
    }, 1000)
  }

  // Immediate search function
  const performSearch = async (searchTerm: string, page = 0) => {
    if (!searchTerm.trim()) return

    setIsSearching(true)
    setShowSuggestions(false)
    setSearchQuery(searchTerm)

    try {
      const response = await fetch(
        `http://localhost:8001/search/?q=${encodeURIComponent(searchTerm)}&size=${pageSize}&offset=${page}`,
      )
      const data: SearchResponse = await response.json()

      if (page === 0) {
        setSearchResults(data.results)
      } else {
        setSearchResults((prev) => [...prev, ...data.results])
      }

      setHasMoreResults(data.results.length === pageSize)
      setCurrentPage(page)
    } catch (error) {
      console.error("Error searching:", error)
      setSearchResults([])
      setHasMoreResults(false)
    } finally {
      setIsSearching(false)
    }
  }

  // Handle search submission
  const handleSearch = (searchTerm?: string) => {
    const term = searchTerm || query
    if (term.trim()) {
      performSearch(term, 0)
    }
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    setShowSuggestions(false)
    performSearch(suggestion, 0)
  }

  // Load more results
  const loadMoreResults = () => {
    if (searchQuery && !isSearching) {
      performSearch(searchQuery, currentPage + 1)
    }
  }

  // Fetch AI summary
  const fetchSummary = async (modId: number) => {
    setIsLoadingSummary(true)
    try {
      const response = await fetch(`http://localhost:8001/summary/${modId}/`)
      const data: SummaryResponse = await response.json()
      setSelectedSummary(data)
    } catch (error) {
      console.error("Error fetching summary:", error)
    } finally {
      setIsLoadingSummary(false)
    }
  }

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    } else if (e.key === "Escape") {
      setShowSuggestions(false)
    }
  }

  // Clear debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-green-400 mb-2 font-mono tracking-wider drop-shadow-lg">
            ⛏️ MINECRAFT MODS SEARCH ⛏️
          </h1>
          <p className="text-gray-300 text-lg font-mono">Discover amazing mods from the depths of CurseForge</p>
          <div className="w-32 h-1 bg-gradient-to-r from-green-400 to-emerald-500 mx-auto mt-4 rounded"></div>
        </div>

        {/* Search Section */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <div className="flex items-center space-x-3 mb-4 bg-gray-800 p-4 rounded-lg border-2 border-gray-700">
              <Switch
                id="autocomplete-mode"
                checked={useAdvancedAutocomplete}
                onCheckedChange={setUseAdvancedAutocomplete}
                className="data-[state=checked]:bg-green-600"
              />
              <Label htmlFor="autocomplete-mode" className="text-green-400 font-mono font-semibold">
                {useAdvancedAutocomplete ? "🔮 ADVANCED" : "⚡ FAST"} AUTOCOMPLETE
              </Label>
            </div>

            <div className="relative">
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search for epic mods..."
                value={query}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyPress}
                onFocus={() => { 
                  if (query.trim()) { 
                    fetchSuggestions(query);
                  }
                }}
                onBlur={() => { 
                  setTimeout(() => {
                    setShowSuggestions(false);
                  }, 150); 
                }}
                className="pl-12 pr-32 py-4 text-lg bg-gray-800 border-2 border-gray-600 text-green-100 placeholder-gray-400 focus:border-green-500 focus:ring-green-500 font-mono rounded-lg"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-400 w-6 h-6" />
              <Button
                onClick={() => handleSearch()}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-green-600 hover:bg-green-700 text-white font-mono font-bold px-6 py-2 rounded border-2 border-green-500 shadow-lg"
                disabled={isSearching}
              >
                {isSearching ? "⏳ MINING..." : "🔍 SEARCH"}
              </Button>
            </div>

            {/* Autocomplete Suggestions */}
            {showSuggestions && suggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-gray-800 border-2 border-gray-600 rounded-lg shadow-2xl z-10 mt-2 overflow-hidden">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-700 text-green-100 font-mono border-b border-gray-700 last:border-b-0 transition-colors"
                  >
                    🔸 {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-gray-800 p-4 rounded-lg border-2 border-gray-700">
              <h2 className="text-2xl font-bold text-green-400 font-mono">📦 SEARCH RESULTS FOR "{searchQuery}"</h2>
              <span className="text-gray-300 font-mono bg-gray-700 px-3 py-1 rounded border border-gray-600">
                {searchResults.length} mod{searchResults.length !== 1 ? "s" : ""} found
              </span>
            </div>

            <div className="grid gap-6">
              {searchResults.map((mod) => (
                <Card
                  key={mod.id}
                  className="bg-gray-800 border-2 border-gray-700 hover:border-green-500 transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/20"
                >
                  <CardHeader className="border-b border-gray-700">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-3 text-green-400 font-mono font-bold">
                          🧩 {mod.title}
                        </CardTitle>
                        <CardDescription className="flex items-center space-x-6 text-sm text-gray-300">
                          <span className="flex items-center bg-gray-700 px-2 py-1 rounded border border-gray-600">
                            <Users className="w-4 h-4 mr-2 text-blue-400" />
                            <span className="font-mono">{mod.authors.join(", ")}</span>
                          </span>
                          <span className="flex items-center bg-gray-700 px-2 py-1 rounded border border-gray-600">
                            <Star className="w-4 h-4 mr-2 text-yellow-400" />
                            {/* Perubahan untuk popularityRank */}
                            <span className="font-mono">Download Count: #{mod.popularityRank.toLocaleString()}</span>
                          </span>
                        </CardDescription>
                      </div>
                      <div className="flex space-x-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchSummary(mod.id)}
                          disabled={isLoadingSummary}
                          className="bg-purple-700 hover:bg-purple-600 text-white border-purple-600 font-mono font-bold"
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          {/* Perubahan teks tombol AI Summary */}
                          {isLoadingSummary ? "SUMMARIZING..." : "SUMMARIZE WITH AI"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(mod.websiteUrl, "_blank")}
                          className="bg-blue-700 hover:bg-blue-600 text-white border-blue-600 font-mono font-bold"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" /> VIEW
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-gray-300 mb-4 line-clamp-3 font-mono leading-relaxed">{mod.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {mod.categories.map((category) => (
                        <Badge
                          key={category}
                          className="bg-green-700 hover:bg-green-600 text-green-100 border border-green-600 font-mono font-semibold px-3 py-1"
                        >
                          🏷️ {category}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Load More Button */}
            {hasMoreResults && (
              <div className="text-center mt-8">
                <Button
                  onClick={loadMoreResults}
                  disabled={isSearching}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white font-mono font-bold px-8 py-4 text-lg border-2 border-green-500 shadow-lg hover:shadow-green-500/30 transition-all"
                >
                  <ChevronRight className="w-5 h-5 mr-2" />
                  {isSearching ? "⏳ MINING MORE..." : "⛏️ MINE MORE RESULTS"}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* AI Summary Modal */}
        {selectedSummary && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50">
            <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto bg-gray-800 border-2 border-purple-600 shadow-2xl shadow-purple-500/30">
              <CardHeader className="border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-purple-400 font-mono font-bold text-xl">
                    <Sparkles className="w-6 h-6 mr-3 text-purple-400" />🔮 AI ENCHANTMENT SUMMARY
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedSummary(null)}
                    className="text-gray-400 hover:text-white hover:bg-gray-700 font-mono font-bold text-xl"
                  >
                    ❌
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <h3 className="font-bold text-lg mb-4 text-green-400 font-mono">📦 {selectedSummary.title}</h3>
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-600">
                  <p className="text-gray-300 leading-relaxed font-mono">{selectedSummary.summary}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {searchQuery && searchResults.length === 0 && !isSearching && (
          <div className="text-center py-12 bg-gray-800 rounded-lg border-2 border-gray-700">
            <div className="text-gray-400 mb-6">
              <div className="text-6xl mb-4">⛏️</div>
              <Search className="w-16 h-16 mx-auto text-gray-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-400 mb-3 font-mono">🚫 NO MODS DISCOVERED</h3>
            <p className="text-gray-500 font-mono">Try different search terms or explore the vast world of modding!</p>
          </div>
        )}
      </div>
    </div>
  )
}
