# Category Icons Feature

## Overview
Categories in the admin interface now support icon selection instead of (or in addition to) colors. This provides a more visual and intuitive way to identify categories throughout the platform.

## Features

### Icon Picker
- **200+ Icons Available**: A curated collection of outline/line-style icons organized by category
- **Searchable**: Quickly find icons by name or category
- **Preview**: See the icon immediately in the category list
- **Both Parent & Subcategories**: Icons can be assigned to both main categories and subcategories

### Icon Collections
Icons are organized into these categories for easy browsing:
- **Construction & Tools**: Wrench, Hammer, Drill, HardHat, Building, etc.
- **Electronics & Tech**: Cpu, Smartphone, Laptop, Monitor, Camera, etc.
- **Fashion & Accessories**: Shirt, Watch, Glasses, Crown, Diamond, etc.
- **Health & Medical**: Heart, Pill, Stethoscope, Activity, etc.
- **Education & Books**: Book, GraduationCap, PenTool, etc.
- **Arts & Entertainment**: Palette, Music, Film, Gamepad, etc.
- **Sports & Fitness**: Trophy, Target, Dumbbell, Bike, etc.
- **Transportation**: Car, Truck, Plane, Ship, Bus, etc.
- **Food & Beverage**: Utensils, Coffee, Pizza, Wine, etc.
- **Shopping & Business**: ShoppingCart, Store, Package, Briefcase, etc.
- **Nature & Environment**: TreePine, Leaf, Flower, Mountain, Sun, etc.
- **Office & Documents**: FileText, Folder, Calculator, Clipboard, etc.
- **Communication**: Mail, MessageCircle, Phone, Video, Send, etc.
- **General & UI**: Home, Settings, Star, Tag, Users, Grid, etc.

## How to Use

### Adding an Icon to a Category

1. **Navigate to Admin Panel**
   - Go to `/admin` in your browser
   - Login with super admin credentials

2. **Open Categories**
   - Click on "Categories" in the admin sidebar
   - Select an existing category or create a new one

3. **Select an Icon**
   - Find the "Icon" field in the category form
   - Click on the dropdown button
   - Use the search bar to find an icon by name
   - Browse through categories to find the perfect icon
   - Click on an icon to select it

4. **Save the Category**
   - The selected icon will be displayed in the button
   - Save the category to apply changes

### Icon Display

Icons will automatically appear in:
- **Homepage Filters Sidebar**: Next to category names in the collapsible filter list
- **Category Navigation Sidebar**: In the main category navigation menu
- **Category Pages**: Throughout the frontend where categories are displayed

### Examples

**Construction Category**:
- Icon: `Hammer` or `HardHat`
- Result: 🔨 Construction

**Electronics Category**:
- Icon: `Smartphone` or `Laptop`
- Result: 📱 Electronics

**Food & Beverage Category**:
- Icon: `Utensils` or `Coffee`
- Result: 🍴 Food & Beverage

## Technical Details

### Files Modified
- `/src/collections/Categories.ts` - Added icon field to collection
- `/src/components/admin/icon-picker.tsx` - Icon picker component
- `/src/components/admin/icon-field.tsx` - Payload custom field wrapper
- `/src/modules/home/ui/components/search-filters/filters-sidebar.tsx` - Display icons in filters
- `/src/modules/home/ui/components/search-filters/categories-sidebar.tsx` - Display icons in navigation

### Icon Library
Uses **lucide-react** - a collection of beautiful, consistent outline icons.

### Backward Compatibility
- Existing categories without icons will work normally
- Color field is still available and can be used alongside icons
- No migration needed - icon field is optional

## Notes
- Icons are stored as text (icon name) in the database
- Icons are rendered client-side using the lucide-react library
- Search functionality helps find icons quickly in the 200+ icon collection
- Icons are displayed at 16-20px size for optimal visibility
