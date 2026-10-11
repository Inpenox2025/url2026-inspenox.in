import { onRequest as ___netlify_functions___path___js_onRequest } from "C:\\Users\\saira\\Downloads\\url2026-inspenox.in\\functions\\.netlify\\functions\\[[path]].js"
import { onRequest as __api___path___js_onRequest } from "C:\\Users\\saira\\Downloads\\url2026-inspenox.in\\functions\\api\\[[path]].js"

export const routes = [
    {
      routePath: "/.netlify/functions/:path*",
      mountPath: "/.netlify/functions",
      method: "",
      middlewares: [],
      modules: [___netlify_functions___path___js_onRequest],
    },
  {
      routePath: "/api/:path*",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api___path___js_onRequest],
    },
  ]