"use client"

import { useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Plus, Copy, Check, RefreshCw } from "lucide-react"
import { FormulaBlockComponent } from "./formula-block"
import type { FormulaBlock, FormulaBlocksResponse } from "../lib/api"
import { assembleFormula } from "../lib/api"

interface FormulaBuilderProps {
  initialData: FormulaBlocksResponse
  onFormulaChange?: (formula: string) => void
}

export function FormulaBuilder({ initialData, onFormulaChange }: FormulaBuilderProps) {
  const [blocks, setBlocks] = useState<FormulaBlock[]>(initialData.blocks)
  const [blockOperators, setBlockOperators] = useState<string[]>(initialData.block_operators)
  const [ipcCodes] = useState<string[]>(initialData.ipc_codes)
  const [excludedTerms] = useState<string[]>(initialData.excluded_terms)
  const [assembledFormula, setAssembledFormula] = useState(initialData.assembled_formula)
  const [copied, setCopied] = useState(false)
  const [isAssembling, setIsAssembling] = useState(false)

  // Reassemble formula when blocks or operators change
  const reassembleFormula = useCallback(async () => {
    if (blocks.length === 0) {
      setAssembledFormula("")
      onFormulaChange?.("")
      return
    }

    // Check if any block has keywords
    const hasValidBlocks = blocks.some((b) => b.keywords.length > 0)
    if (!hasValidBlocks) {
      setAssembledFormula("")
      onFormulaChange?.("")
      return
    }

    setIsAssembling(true)
    try {
      // Pass all blocks to backend - it handles empty block filtering
      // with proper operator alignment (implemented in FormulaBuilder.build_from_blocks)
      const result = await assembleFormula(blocks, blockOperators, ipcCodes, excludedTerms)
      setAssembledFormula(result.assembled_formula)
      onFormulaChange?.(result.assembled_formula)
    } catch (error) {
      console.error("Failed to assemble formula:", error)
    } finally {
      setIsAssembling(false)
    }
  }, [blocks, blockOperators, ipcCodes, excludedTerms, onFormulaChange])

  // Debounced reassembly on changes
  useEffect(() => {
    const timer = setTimeout(() => {
      reassembleFormula()
    }, 500)
    return () => clearTimeout(timer)
  }, [reassembleFormula])

  const handleBlockChange = (index: number, updatedBlock: FormulaBlock) => {
    setBlocks((prev) => prev.map((b, i) => (i === index ? updatedBlock : b)))
  }

  const handleBlockDelete = (index: number) => {
    setBlocks((prev) => prev.filter((_, i) => i !== index))
    // Remove the operator before this block (or after if it's the first block)
    if (blockOperators.length > 0) {
      const opIndex = index === 0 ? 0 : index - 1
      setBlockOperators((prev) => prev.filter((_, i) => i !== opIndex))
    }
  }

  const handleOperatorChange = (index: number, value: string) => {
    setBlockOperators((prev) => prev.map((op, i) => (i === index ? value : op)))
  }

   const handleAddBlock = () => {
    const newBlock: FormulaBlock = {
      id: `block-${Date.now()}`,
      name: `Block ${blocks.length + 1}`,
      field: "TAC",
      keywords: [],
      operator: "OR",
      ipc_codes: [], // New blocks have no IPC codes by default
      enabled: true, // New blocks are enabled by default
    }
    setBlocks((prev) => [...prev, newBlock])
    // Add operator between previous last block and new block
    if (blocks.length > 0) {
      setBlockOperators((prev) => [...prev, "AND"])
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(assembledFormula)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  return (
    <div className="space-y-4">
      {/* Blocks */}
      <AnimatePresence mode="popLayout">
        {blocks.map((block, index) => (
          <motion.div key={block.id} layout>
            <FormulaBlockComponent
              block={block}
              onChange={(updated) => handleBlockChange(index, updated)}
              onDelete={() => handleBlockDelete(index)}
              canDelete={blocks.length > 1}
            />

            {/* Operator between blocks - Pill Toggle */}
            {index < blocks.length - 1 && (
              <motion.div
                layout
                className="relative flex items-center justify-center py-4"
              >
                {/* Vertical connector line through entire section */}
                <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border" />
                
                {/* Pill button centered */}
                <motion.button
                  onClick={() =>
                    handleOperatorChange(
                      index,
                      blockOperators[index] === "AND" ? "OR" : "AND"
                    )
                  }
                  className="relative z-10"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div
                    className={`rounded-full px-5 py-1.5 text-sm font-semibold shadow-md transition-all ${
                      blockOperators[index] === "AND"
                        ? "bg-primary text-white hover:bg-primary/90"
                        : "bg-amber-500 text-white hover:bg-amber-600"
                    }`}
                  >
                    {blockOperators[index] || "AND"}
                  </div>
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Add Block Button */}
      <button
        onClick={handleAddBlock}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-4 text-text-muted hover:border-primary hover:text-primary"
      >
        <Plus className="h-5 w-5" />
        블록 추가
      </button>

      {/* Assembled Formula Preview */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-medium text-text">
            조립된 검색식
          </h3>
          <div className="flex items-center gap-2">
            {isAssembling && (
              <RefreshCw className="h-4 w-4 animate-spin text-text-muted" />
            )}
            <button
              onClick={handleCopy}
              disabled={!assembledFormula}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-text hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-500" />
                  복사됨!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  복사
                </>
              )}
            </button>
          </div>
        </div>
        <div className="min-h-[60px] rounded-lg bg-white p-3 font-mono text-sm text-text">
          {assembledFormula || (
            <span className="italic text-text-muted">
              블록에 키워드를 추가하면 검색식이 생성됩니다...
            </span>
          )}
        </div>
      </div>

      {/* Additional Info */}
      {(ipcCodes.length > 0 || excludedTerms.length > 0) && (
        <div className="space-y-2 text-sm">
          {ipcCodes.length > 0 && (
            <div>
              <span className="font-medium text-text">IPC 코드: </span>
              <span className="text-text-muted">{ipcCodes.join(", ")}</span>
            </div>
          )}
          {excludedTerms.length > 0 && (
            <div>
              <span className="font-medium text-text">제외어: </span>
              <span className="text-text-muted">{excludedTerms.join(", ")}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
