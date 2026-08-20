"use client";
import React, { useState, useEffect, useRef } from "react";
import { Input } from "./input";
import axios from "axios";
import { Loader2 } from "lucide-react";
import useDebounce from "@/hooks/useDebounce";

interface AutocompleteInputProps {
	value: string;
	onChange: (value: string) => void;
	onSelect?: (value: string) => void;
	placeholder?: string;
	type: "community" | "subdivision" | "school";
	className?: string;
}

export function AutocompleteInput({
	value,
	onChange,
	onSelect,
	placeholder,
	type,
	className,
}: AutocompleteInputProps) {
	const [options, setOptions] = useState<string[]>([]);
	const [isOpen, setIsOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const wrapperRef = useRef<HTMLDivElement>(null);

	// Close on click outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	// Fetch suggestions
	useEffect(() => {
		const fetchSuggestions = async () => {
			if (!value || value.length < 2) {
				setOptions([]);
				setIsOpen(false);
				return;
			}
			setIsLoading(true);
			try {
				const res = await axios.get(`/api/autocomplete?type=${type}&q=${encodeURIComponent(value)}`);
				if (res.data?.success) {
					// Don't show options if the only option matches what's typed perfectly (already selected)
					if (res.data.data.length === 1 && res.data.data[0].toLowerCase() === value.toLowerCase()) {
						setOptions([]);
						setIsOpen(false);
					} else {
						setOptions(res.data.data);
						setIsOpen(res.data.data.length > 0);
					}
				}
			} catch (error) {
				console.error("Autocomplete fetch error", error);
			} finally {
				setIsLoading(false);
			}
		};

		const timeoutId = setTimeout(fetchSuggestions, 300); // 300ms debounce
		return () => clearTimeout(timeoutId);
	}, [value, type]);

	return (
		<div className="relative w-full" ref={wrapperRef}>
			<div className="relative">
				<Input
					type="text"
					value={value}
					onChange={(e) => {
						onChange(e.target.value);
					}}
					onFocus={() => {
						if (options.length > 0) setIsOpen(true);
					}}
					placeholder={placeholder}
					className={className}
					autoComplete="off"
				/>
				{isLoading && (
					<div className="absolute right-3 top-1/2 -translate-y-1/2">
						<Loader2 className="w-4 h-4 animate-spin text-gray-400" />
					</div>
				)}
			</div>
			
			{isOpen && options.length > 0 && (
				<div className="absolute z-[999] top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
					<ul className="py-1">
						{options.map((option, idx) => (
							<li
								key={idx}
								className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
								onMouseDown={(e) => e.preventDefault()}
								onTouchStart={(e) => e.preventDefault()}
								onClick={(e) => {
									onChange(option);
									setIsOpen(false);
									if (onSelect) {
										onSelect(option);
									}
								}}
							>
								{option}
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
}
