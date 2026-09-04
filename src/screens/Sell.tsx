import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Info, Loader2, Plus, Tag, X } from 'lucide-react'
import { createListing, uploadListingImage } from '../data/api'
import { useAuth } from '../data/AuthProvider'
import type { Listing } from '../data/types'
import { PageBody, PageHeader } from '../layout/Page'
import { Img } from '../components/ui'

const SLOTS = 4

export default function Sell() {
  const navigate = useNavigate()
  const { profile, demo } = useAuth()
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const MAX_IMAGES = 10

  const pickImages = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, MAX_IMAGES - images.length)
    e.target.value = ''
    if (files.length === 0) return

    // Without a backend the previews are local object URLs, so the uploader is
    // still demonstrable offline.
    if (demo || !profile) {
      setImages((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))])
      return
    }

    setUploading(true)
    setError(null)
    try {
      const urls = await Promise.all(
        files.map((file) => uploadListingImage(file, profile.id)),
      )
      setImages((prev) => [...prev, ...urls])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload the image.')
    } finally {
      setUploading(false)
    }
  }

  const submit = async (e: FormEvent<HTMLFormElement>, status: 'draft' | 'active') => {
    e.preventDefault()

    if (demo || !profile) {
      navigate('/explore')
      return
    }

    const form = new FormData(e.currentTarget)
    setSaving(true)
    setError(null)
    try {
      await createListing({
        seller_id: profile.id,
        title: String(form.get('title') ?? ''),
        description: String(form.get('description') ?? ''),
        price: Number(form.get('price') ?? 0),
        category: form.get('category') as Listing['category'],
        condition: form.get('condition') as Listing['condition'],
        location: String(form.get('location') ?? ''),
        image_urls: images,
        status,
      })
      navigate('/explore')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the listing.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={(e) => void submit(e, 'active')}
      className="flex min-h-screen flex-col lg:min-h-0"
    >
      <PageHeader title="Create Listing" back />

      <PageBody className="flex-1">
        <section>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold">Upload Images</h2>
            <span className="rounded-full bg-surface-sunken px-2.5 py-1 text-xs font-semibold text-ink-soft">
              Up to 10
            </span>
            <span className="ml-auto text-sm font-semibold text-ink-muted">
              {images.length} / {MAX_IMAGES}
            </span>
          </div>

          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={(e) => void pickImages(e)}
            aria-label="Choose listing photos"
            className="sr-only"
          />

          <div className="mt-4 grid grid-cols-4 gap-3 md:grid-cols-6 lg:gap-4">
            {images.length < MAX_IMAGES && (
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={uploading}
                className="grid aspect-square place-items-center rounded-field border-2 border-dashed border-ink-faint/60 bg-surface-sunken text-ink-soft transition hover:border-brand-400 hover:text-brand-500"
              >
                <span className="flex flex-col items-center gap-1">
                  {uploading ? (
                    <Loader2 size={22} className="animate-spin" />
                  ) : (
                    <Plus size={22} />
                  )}
                  <span className="text-xs font-semibold">
                    {uploading ? 'Uploading' : 'Add'}
                  </span>
                </span>
              </button>
            )}

            {images.map((src, i) => (
              <div key={src} className="group relative">
                <Img
                  src={src}
                  alt={`Listing photo ${i + 1}`}
                  className="aspect-square w-full rounded-field"
                />
                <button
                  type="button"
                  onClick={() => setImages((prev) => prev.filter((u) => u !== src))}
                  aria-label={`Remove photo ${i + 1}`}
                  className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
                >
                  <X size={15} />
                </button>
                {i === 0 && (
                  <span className="absolute bottom-1.5 left-1.5 rounded-full bg-surface/95 px-2 py-0.5 text-[10px] font-bold uppercase text-ink">
                    Cover
                  </span>
                )}
              </div>
            ))}

            {Array.from({
              length: Math.max(0, SLOTS - 1 - images.length),
            }).map((_, i) => (
              <div
                key={`slot-${i}`}
                className="grid aspect-square place-items-center rounded-field border-2 border-dashed border-line text-ink-faint/60"
              >
                <Camera size={20} />
              </div>
            ))}
          </div>

          <p className="mt-3 flex gap-2 text-sm leading-relaxed text-ink-muted">
            <Info size={16} className="mt-0.5 shrink-0" />
            High-quality photos increase your chances of a sale. Use natural
            lighting and clear backgrounds.
          </p>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <label htmlFor="title" className="block font-bold">
              Listing Title <span className="text-danger">*</span>
            </label>
            <input
              id="title"
              name="title"
              required
              placeholder="e.g. MacBook Pro M2 2023 - Space Gray"
              className="field mt-2"
            />
          </div>

          <div>
            <label htmlFor="price" className="block font-bold">
              Price (R) <span className="text-danger">*</span>
            </label>
            <input
              id="price"
              name="price"
              required
              type="number"
              min="0"
              step="0.01"
              placeholder="R0.00"
              className="field mt-2"
            />
          </div>

          <div>
            <label htmlFor="category" className="block font-bold">
              Category <span className="text-danger">*</span>
            </label>
            <div className="relative mt-2">
              <Tag
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint"
              />
              <select
                id="category"
                name="category"
                required
                defaultValue=""
                className="field pl-11"
              >
                <option value="" disabled>
                  Select Category
                </option>
                <option value="textbooks">Textbooks</option>
                <option value="electronics">Electronics</option>
                <option value="services">Services</option>
                <option value="furniture">Home &amp; Furniture</option>
                <option value="housing">Housing</option>
              </select>
            </div>
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="description" className="block font-bold">
              Description <span className="text-danger">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={5}
              placeholder="Describe your item's condition, features, and why you're selling..."
              className="field mt-2 resize-y"
            />
          </div>

          <div>
            <label htmlFor="condition" className="block font-bold">
              Condition <span className="text-danger">*</span>
            </label>
            <select
              id="condition"
              name="condition"
              required
              defaultValue="good"
              className="field mt-2"
            >
              <option value="new">New</option>
              <option value="like_new">Like New</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
            </select>
          </div>

          <div>
            <label htmlFor="location" className="block font-bold">
              Preferred meet-up point
            </label>
            <select
              id="location"
              name="location"
              defaultValue="University Library (Safe Zone)"
              className="field mt-2"
            >
              <option>University Library (Safe Zone)</option>
              <option>Student Union (Safe Zone)</option>
              <option>Main Quad, Sector 4B</option>
            </select>
          </div>
        </section>
      </PageBody>

      <div className="sticky bottom-[76px] z-20 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur lg:bottom-0 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {error && (
            <p role="alert" className="mb-2 text-center text-sm text-danger">
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <button
              type="submit"
              formNoValidate
              disabled={saving}
              onClick={(e) => {
                e.preventDefault()
                const form = e.currentTarget.form
                if (form) {
                  void submit(
                    { preventDefault() {}, currentTarget: form } as unknown as FormEvent<HTMLFormElement>,
                    'draft',
                  )
                }
              }}
              className="btn-ghost flex-1 py-3.5"
            >
              Save Draft
            </button>
            <button type="submit" disabled={saving} className="btn-dark flex-1 py-3.5">
              {saving ? 'Publishing...' : 'Publish Listing'}
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}
