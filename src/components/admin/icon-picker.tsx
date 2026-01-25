"use client";

import React, { useState } from "react";
import {
  Wrench,
  Home,
  Hammer,
  Drill,
  HardHat,
  Building,
  Building2,
  Truck,
  ShoppingCart,
  Package,
  Boxes,
  Cpu,
  Smartphone,
  Laptop,
  Monitor,
  Printer,
  Camera,
  Headphones,
  Speaker,
  Tv,
  Zap,
  Lightbulb,
  Plug,
  Battery,
  Shirt,
  ShoppingBag,
  Watch,
  Glasses,
  Heart,
  Cross,
  Pill,
  Stethoscope,
  Activity,
  Book,
  BookOpen,
  GraduationCap,
  PenTool,
  Palette,
  Paintbrush,
  Music,
  Film,
  Image,
  Disc,
  Gamepad2,
  Trophy,
  Target,
  Dumbbell,
  Bike,
  Car,
  Plane,
  Ship,
  Bus,
  MapPin,
  Compass,
  Utensils,
  Coffee,
  Pizza,
  Apple,
  Carrot,
  Soup,
  Wine,
  Candy,
  IceCream,
  Cake,
  Store,
  Warehouse,
  Factory,
  TreePine,
  Leaf,
  Flower2,
  Sprout,
  Trees,
  Mountain,
  Waves,
  Sun,
  Moon,
  Cloud,
  Droplet,
  Flame,
  Wind,
  Snowflake,
  Sparkles,
  Star,
  Gift,
  PartyPopper,
  Crown,
  Diamond,
  Gem,
  CircleDollarSign,
  Coins,
  CreditCard,
  Banknote,
  Briefcase,
  Calculator,
  FileText,
  Folder,
  Archive,
  Clipboard,
  ClipboardList,
  Calendar,
  Clock,
  Timer,
  Hourglass,
  Lock,
  Key,
  Shield,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  HelpCircle,
  Settings,
  Cog,
  Scissors,
  Ruler,
  PaintBucket,
  Pipette,
  Anchor,
  Flag,
  Tag,
  Tags,
  Bookmark,
  Link,
  Share2,
  Send,
  Mail,
  MessageCircle,
  Phone,
  Video,
  Radio,
  Wifi,
  Bluetooth,
  Usb,
  Database,
  Server,
  Cloud as CloudServer,
  HardDrive,
  Save,
  Download,
  Upload,
  Trash2,
  Edit,
  Copy,
  FileEdit,
  FilePlus,
  FileMinus,
  Search,
  Filter,
  SlidersHorizontal,
  BarChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  Users,
  User,
  UserPlus,
  UserCheck,
  UserX,
  Eye,
  EyeOff,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Bell,
  BellOff,
  Grid,
  List,
  Layers,
  Layout,
  Sidebar,
  Menu,
  MoreVertical,
  MoreHorizontal,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Plus,
  Minus,
  X,
  Check,
  Circle,
  Square,
  Triangle,
  Hexagon,
  Octagon,
} from "lucide-react";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Icon collection - organized by category
export const ICON_COLLECTION: Record<string, { icon: LucideIcon; name: string }[]> = {
  "Construction & Tools": [
    { icon: Wrench, name: "Wrench" },
    { icon: Hammer, name: "Hammer" },
    { icon: Drill, name: "Drill" },
    { icon: HardHat, name: "HardHat" },
    { icon: Building, name: "Building" },
    { icon: Building2, name: "Building2" },
    { icon: Scissors, name: "Scissors" },
    { icon: Ruler, name: "Ruler" },
    { icon: PaintBucket, name: "PaintBucket" },
    { icon: Paintbrush, name: "Paintbrush" },
  ],
  "Electronics & Tech": [
    { icon: Cpu, name: "Cpu" },
    { icon: Smartphone, name: "Smartphone" },
    { icon: Laptop, name: "Laptop" },
    { icon: Monitor, name: "Monitor" },
    { icon: Printer, name: "Printer" },
    { icon: Camera, name: "Camera" },
    { icon: Headphones, name: "Headphones" },
    { icon: Speaker, name: "Speaker" },
    { icon: Tv, name: "Tv" },
    { icon: Zap, name: "Zap" },
    { icon: Lightbulb, name: "Lightbulb" },
    { icon: Plug, name: "Plug" },
    { icon: Battery, name: "Battery" },
    { icon: Bluetooth, name: "Bluetooth" },
    { icon: Wifi, name: "Wifi" },
    { icon: Usb, name: "Usb" },
  ],
  "Fashion & Accessories": [
    { icon: Shirt, name: "Shirt" },
    { icon: ShoppingBag, name: "ShoppingBag" },
    { icon: Watch, name: "Watch" },
    { icon: Glasses, name: "Glasses" },
    { icon: Crown, name: "Crown" },
    { icon: Diamond, name: "Diamond" },
    { icon: Gem, name: "Gem" },
  ],
  "Health & Medical": [
    { icon: Heart, name: "Heart" },
    { icon: Cross, name: "Cross" },
    { icon: Pill, name: "Pill" },
    { icon: Stethoscope, name: "Stethoscope" },
    { icon: Activity, name: "Activity" },
  ],
  "Education & Books": [
    { icon: Book, name: "Book" },
    { icon: BookOpen, name: "BookOpen" },
    { icon: GraduationCap, name: "GraduationCap" },
    { icon: PenTool, name: "PenTool" },
  ],
  "Arts & Entertainment": [
    { icon: Palette, name: "Palette" },
    { icon: Music, name: "Music" },
    { icon: Film, name: "Film" },
    { icon: Image, name: "Image" },
    { icon: Disc, name: "Disc" },
    { icon: Gamepad2, name: "Gamepad2" },
  ],
  "Sports & Fitness": [
    { icon: Trophy, name: "Trophy" },
    { icon: Target, name: "Target" },
    { icon: Dumbbell, name: "Dumbbell" },
    { icon: Bike, name: "Bike" },
  ],
  "Transportation": [
    { icon: Car, name: "Car" },
    { icon: Truck, name: "Truck" },
    { icon: Plane, name: "Plane" },
    { icon: Ship, name: "Ship" },
    { icon: Bus, name: "Bus" },
    { icon: MapPin, name: "MapPin" },
    { icon: Compass, name: "Compass" },
  ],
  "Food & Beverage": [
    { icon: Utensils, name: "Utensils" },
    { icon: Coffee, name: "Coffee" },
    { icon: Pizza, name: "Pizza" },
    { icon: Apple, name: "Apple" },
    { icon: Carrot, name: "Carrot" },
    { icon: Soup, name: "Soup" },
    { icon: Wine, name: "Wine" },
    { icon: Candy, name: "Candy" },
    { icon: IceCream, name: "IceCream" },
    { icon: Cake, name: "Cake" },
  ],
  "Shopping & Business": [
    { icon: ShoppingCart, name: "ShoppingCart" },
    { icon: Store, name: "Store" },
    { icon: Package, name: "Package" },
    { icon: Boxes, name: "Boxes" },
    { icon: Warehouse, name: "Warehouse" },
    { icon: Factory, name: "Factory" },
    { icon: Briefcase, name: "Briefcase" },
    { icon: CircleDollarSign, name: "CircleDollarSign" },
    { icon: Coins, name: "Coins" },
    { icon: CreditCard, name: "CreditCard" },
    { icon: Banknote, name: "Banknote" },
  ],
  "Nature & Environment": [
    { icon: TreePine, name: "TreePine" },
    { icon: Leaf, name: "Leaf" },
    { icon: Flower2, name: "Flower2" },
    { icon: Sprout, name: "Sprout" },
    { icon: Trees, name: "Trees" },
    { icon: Mountain, name: "Mountain" },
    { icon: Waves, name: "Waves" },
    { icon: Sun, name: "Sun" },
    { icon: Moon, name: "Moon" },
    { icon: Cloud, name: "Cloud" },
    { icon: Droplet, name: "Droplet" },
    { icon: Flame, name: "Flame" },
    { icon: Wind, name: "Wind" },
    { icon: Snowflake, name: "Snowflake" },
  ],
  "Office & Documents": [
    { icon: FileText, name: "FileText" },
    { icon: Folder, name: "Folder" },
    { icon: Archive, name: "Archive" },
    { icon: Clipboard, name: "Clipboard" },
    { icon: ClipboardList, name: "ClipboardList" },
    { icon: Calculator, name: "Calculator" },
  ],
  "Time & Date": [
    { icon: Calendar, name: "Calendar" },
    { icon: Clock, name: "Clock" },
    { icon: Timer, name: "Timer" },
    { icon: Hourglass, name: "Hourglass" },
  ],
  "Security": [
    { icon: Lock, name: "Lock" },
    { icon: Key, name: "Key" },
    { icon: Shield, name: "Shield" },
  ],
  "Communication": [
    { icon: Mail, name: "Mail" },
    { icon: MessageCircle, name: "MessageCircle" },
    { icon: MessageSquare, name: "MessageSquare" },
    { icon: Phone, name: "Phone" },
    { icon: Video, name: "Video" },
    { icon: Send, name: "Send" },
  ],
  "General & UI": [
    { icon: Home, name: "Home" },
    { icon: Settings, name: "Settings" },
    { icon: Cog, name: "Cog" },
    { icon: Star, name: "Star" },
    { icon: Gift, name: "Gift" },
    { icon: PartyPopper, name: "PartyPopper" },
    { icon: Sparkles, name: "Sparkles" },
    { icon: Tag, name: "Tag" },
    { icon: Tags, name: "Tags" },
    { icon: Bookmark, name: "Bookmark" },
    { icon: Link, name: "Link" },
    { icon: Share2, name: "Share2" },
    { icon: Bell, name: "Bell" },
    { icon: Users, name: "Users" },
    { icon: User, name: "User" },
    { icon: Eye, name: "Eye" },
    { icon: ThumbsUp, name: "ThumbsUp" },
    { icon: Grid, name: "Grid" },
    { icon: List, name: "List" },
    { icon: Layers, name: "Layers" },
    { icon: Layout, name: "Layout" },
  ],
};

// Flatten all icons for easy lookup
const ALL_ICONS = Object.values(ICON_COLLECTION)
  .flat()
  .reduce((acc, { icon, name }) => {
    acc[name] = icon;
    return acc;
  }, {} as Record<string, LucideIcon>);

interface IconPickerProps {
  value?: string;
  onChange: (iconName: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const SelectedIcon = value && ALL_ICONS[value] ? ALL_ICONS[value] : null;

  const filteredCategories = Object.entries(ICON_COLLECTION).reduce((acc, [category, icons]) => {
    const filtered = icons.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      category.toLowerCase().includes(search.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    return acc;
  }, {} as Record<string, typeof ICON_COLLECTION[string]>);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal"
          type="button"
        >
          {SelectedIcon ? (
            <div className="flex items-center gap-2">
              <SelectedIcon className="h-4 w-4" />
              <span>{value}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">Select an icon...</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <div className="p-3 border-b">
          <Input
            placeholder="Search icons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9"
          />
        </div>
        <ScrollArea className="h-[400px]">
          <div className="p-3 space-y-4">
            {Object.entries(filteredCategories).map(([category, icons]) => (
              <div key={category}>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2 px-1">
                  {category}
                </h4>
                <div className="grid grid-cols-6 gap-1">
                  {icons.map(({ icon: Icon, name }) => (
                    <Button
                      key={name}
                      variant={value === name ? "default" : "ghost"}
                      size="sm"
                      className="h-10 w-full p-2"
                      onClick={() => {
                        onChange(name);
                        setOpen(false);
                      }}
                      type="button"
                      title={name}
                    >
                      <Icon className="h-5 w-5" />
                    </Button>
                  ))}
                </div>
              </div>
            ))}
            {Object.keys(filteredCategories).length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No icons found
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

// Helper function to get icon component by name
export function getIconByName(name?: string): LucideIcon | null {
  if (!name) return null;
  return ALL_ICONS[name] || null;
}
