"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Search, Loader2, ExternalLink, Users, Tag } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

// Types
interface Mod {
  id: string
  title: string
  authors: string[]
  categories: string[]
  description: string
  popularityRank: number
  websiteUrl: string
}

interface SearchResponse {
  query: string
  results: Mod[]
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"

export default function MinecraftModSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Mod[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedMod, setSelectedMod] = useState<Mod | null>(null)
  const [modSummary, setModSummary] = useState<string>("")
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Debounced autocomplete
  const debounce = useCallback((func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout
    return (...args: any[]) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func.apply(null, args), delay)
    }
  }, [])

  const fetchSuggestions = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setSuggestions([])
        return
      }

      try {
        const response = await fetch(`${API_BASE_URL}/autocomplete/sayt/?q=${encodeURIComponent(searchQuery)}&size=5`)
        if (response.ok) {
          const data: AutocompleteResponse = await response.json()
          setSuggestions(data.suggestions)
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error)
      }
    }, 300),
    [],
  )

  useEffect(() => {
    fetchSuggestions(query)
  }, [query, fetchSuggestions])

  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return

    setLoading(true)
    setShowSuggestions(false)

    try {
      const response = await fetch(`${API_BASE_URL}/search/?q=${encodeURIComponent(searchQuery)}&size=20`)

      if (response.ok) {
        const data: SearchResponse = await response.json()
        setResults(data.results)
        if (data.results.length === 0) {
          toast.info(`No mods found for "${searchQuery}". Try different keywords.`)
        }
      } else {
        throw new Error("Search failed")
      }
    } catch (error) {
      console.error("Search error:", error)
      toast.error("Failed to search for mods. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleModClick = async (mod: Mod) => {
    setSelectedMod(mod)
    setModSummary("")
    setSummaryLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/summary/${mod.id}/`)
      if (response.ok) {
        const data: SummaryResponse = await response.json()
        setModSummary(data.summary)
      } else {
        setModSummary("Summary not available for this mod.")
      }
    } catch (error) {
      console.error("Error fetching summary:", error)
      setModSummary("Failed to load summary.")
    } finally {
      setSummaryLoading(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    setShowSuggestions(false)
    handleSearch(suggestion)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    } else if (e.key === "Escape") {
      setShowSuggestions(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Minecraft Mod Search</h1>
          <p className="text-lg text-gray-600">Discover and explore thousands of Minecraft mods</p>
        </div>

        {/* Search Section */}
        <div className="max-w-2xl mx-auto mb-8 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search for Minecraft mods..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setShowSuggestions(true)
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
              className="pl-10 pr-4 py-3 text-lg"
            />
            <Button
              onClick={() => handleSearch()}
              disabled={loading}
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {/* Autocomplete Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <Card className="absolute top-full left-0 right-0 mt-1 z-10 max-h-60 overflow-y-auto">
              <CardContent className="p-0">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <div className="flex items-center">
                      <Search className="h-4 w-4 text-gray-400 mr-2" />
                      <span>{suggestion}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((mod) => (
              <Card
                key={mod.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleModClick(mod)}
              >
                <CardHeader>
                  <CardTitle className="text-lg line-clamp-2">{mod.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">
                      {mod.authors.length > 0 ? mod.authors.join(", ") : "Unknown Author"}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                    {mod.description || "No description available."}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {mod.categories.slice(0, 3).map((category, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {category}
                      </Badge>
                    ))}
                    {mod.categories.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{mod.categories.length - 3} more
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Rank: #{mod.popularityRank}</span>
                    <ExternalLink className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && results.length === 0 && query && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Start your search</h3>
            <p className="text-gray-600">Enter keywords to find amazing Minecraft mods</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-lg">Searching for mods...</span>
          </div>
        )}
      </div>

      {/* Mod Detail Modal */}
      <Dialog open={!!selectedMod} onOpenChange={() => setSelectedMod(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedMod && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedMod.title}</DialogTitle>
                <DialogDescription className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {selectedMod.authors.length > 0 ? selectedMod.authors.join(", ") : "Unknown Author"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Categories */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Categories
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedMod.categories.map((category, index) => (
                      <Badge key={index} variant="secondary">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* AI Summary */}
                <div>
                  <h4 className="font-semibold mb-2">AI Summary</h4>
                  {summaryLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Generating summary...</span>
                    </div>
                  ) : (
                    <p className="text-gray-700 bg-blue-50 p-3 rounded-lg">{modSummary}</p>
                  )}
                </div>

                <Separator />

                {/* Description */}
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-gray-700 leading-relaxed">
                    {selectedMod.description || "No description available."}
                  </p>
                </div>

                <Separator />

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold">Popularity Rank:</span>
                    <p>#{selectedMod.popularityRank}</p>
                  </div>
                  <div>
                    <span className="font-semibold">Mod ID:</span>
                    <p>{selectedMod.id}</p>
                  </div>
                </div>

                {/* Website Link */}
                {selectedMod.websiteUrl && (
                  <Button onClick={() => window.open(selectedMod.websiteUrl, "_blank")} className="w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Visit Mod Page
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
