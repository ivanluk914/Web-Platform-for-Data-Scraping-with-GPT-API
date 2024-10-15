resource "helm_release" "monitoring" {
  name       = "postgres-operator"
  repository = "https://raw.githubusercontent.com/CrunchyData/postgres-operator/master/helm/install"
  chart      = "postgres-operator"
  namespace  = "postgres-operator"
  create_namespace = true

  depends_on = [module.eks]
}
