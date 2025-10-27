import { Headphones } from "lucide-react"

export default function Footer() {
    return (
        <footer className="w-full py-8 sm:py-12 border-t bg-muted/30">
        <div className="container max-w-screen-xl mx-auto px-4 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Headphones className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">Pod</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">
                Transform any content into personalized podcasts with AI-powered technology.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Product</h4>
              <div className="space-y-2 text-sm">
                <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                  Features
                </a>
                <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                  Pricing
                </a>
                {/* <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                  API
                </a>
                <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                  Integrations
                </a> */}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Company</h4>
              <div className="space-y-2 text-sm">
                <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                  About
                </a>
                {/* <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                  Blog
                </a> */}
                <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                  Careers
                </a>
                <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                  Contact
                </a>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Support</h4>
              <div className="space-y-2 text-sm">
                <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                  Help Center
                </a>
                <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                  Documentation
                </a>
                <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                  Status
                </a>
                <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                  Privacy
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Pod. All rights reserved.</p>
          </div>
        </div>
      </footer>
    )
}