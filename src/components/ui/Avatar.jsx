import { Camera } from 'lucide-react'
import { useRef, useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../../context/AuthContext.jsx'

const PALETTE = [
  'from-violet-500 to-purple-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-teal-600',
  'from-sky-500 to-blue-600',
  'from-fuchsia-500 to-purple-600',
]

function colorFromName(name = '') {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff
  return PALETTE[Math.abs(h) % PALETTE.length]
}

/** Composant avatar réutilisable.
 * Priorité : avatarUrl prop > avatarSeed (Dicebear) > Discord session > initiales
 * Si editable=true, affiche un bouton upload (upload Supabase Storage).
 */
export default function Avatar({ name = '?', avatarUrl, avatarSeed, size = 'md', editable = false, onUpload }) {
  const { session, updateProfile } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [localUrl, setLocalUrl] = useState(null)
  const inputRef = useRef(null)

  const discordUrl = session?.user?.user_metadata?.avatar_url
    || session?.user?.user_metadata?.picture
    || null

  // Générer URL Dicebear depuis le seed si pas d'URL directe
  const dicebearUrl = avatarSeed
    ? `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(avatarSeed)}&backgroundColor=e5e7eb`
    : null

  const finalUrl = localUrl || avatarUrl || dicebearUrl || discordUrl

  const sizeMap = {
    xs:  'w-7 h-7 text-xs rounded-xl',
    sm:  'w-9 h-9 text-sm rounded-xl',
    md:  'w-12 h-12 text-base rounded-2xl',
    lg:  'w-16 h-16 text-2xl rounded-2xl',
    xl:  'w-20 h-20 text-3xl rounded-3xl',
  }
  const cls = sizeMap[size] || sizeMap.md

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !supabase || !session?.user) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${session.user.id}/avatar.${ext}`
      const { error } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      setLocalUrl(publicUrl)
      await updateProfile?.({ avatar_url: publicUrl })
      onUpload?.(publicUrl)
    } catch (err) {
      console.error('Avatar upload failed', err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="relative inline-block">
      {finalUrl ? (
        <img
          src={finalUrl}
          alt={name}
          className={`${cls} object-cover shrink-0`}
        />
      ) : (
        <div
          className={`${cls} bg-gradient-to-br ${colorFromName(name)} grid place-items-center text-white font-display font-bold shrink-0 select-none`}
          aria-hidden="true"
        >
          {name[0]?.toUpperCase() || '?'}
        </div>
      )}

      {editable && (
        <>
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 hover:opacity-100 transition-opacity grid place-items-center text-white"
            aria-label="Changer la photo"
          >
            {uploading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Camera size={18} />
            )}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleFile}
          />
        </>
      )}
    </div>
  )
}
