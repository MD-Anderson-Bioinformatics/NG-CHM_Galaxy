'Base template using which the apis_map.py is generated.'


class APIDef(object):
    'Struct for info required to instantiate clients/messages for API versions.\n\n  Attributes:\n    client_classpath: str, Path to the client class for an API version.\n    messages_modulepath: str, Path to the messages module for an API version.\n    default_version: bool, Whether this API version is the default version for\n    the API.\n  '

    def __init__(self, client_classpath, messages_modulepath, default_version=False):
        self.client_classpath = client_classpath
        self.messages_modulepath = messages_modulepath
        self.default_version = default_version

    def __eq__(self, other):
        return (isinstance(other, self.__class__) and (self.__dict__ == other.__dict__))

    def __ne__(self, other):
        return (not self.__eq__(other))

    def get_init_source(self):
        src_fmt = 'APIDef("{0}", "{1}", {2})'
        return src_fmt.format(self.client_classpath, self.messages_modulepath, self.default_version)

    def __repr__(self):
        return self.get_init_source()


MAP = {'compute': {'v1': APIDef('googlecloudsdk.third_party.apis.compute.v1.compute_v1_client.ComputeV1', 'googlecloudsdk.third_party.apis.compute.v1.compute_v1_messages', True), 'beta': APIDef('googlecloudsdk.third_party.apis.compute.beta.compute_beta_client.ComputeBeta', 'googlecloudsdk.third_party.apis.compute.beta.compute_beta_messages', False), 'alpha': APIDef('googlecloudsdk.third_party.apis.compute.alpha.compute_alpha_client.ComputeAlpha', 'googlecloudsdk.third_party.apis.compute.alpha.compute_alpha_messages', False)}, 'appengine': {'v1beta4': APIDef('googlecloudsdk.third_party.apis.appengine.v1beta4.appengine_v1beta4_client.AppengineV1beta4', 'googlecloudsdk.third_party.apis.appengine.v1beta4.appengine_v1beta4_messages', True)}, 'toolresults': {'v1beta3': APIDef('googlecloudsdk.third_party.apis.toolresults.v1beta3.toolresults_v1beta3_client.ToolresultsV1beta3', 'googlecloudsdk.third_party.apis.toolresults.v1beta3.toolresults_v1beta3_messages', True)}, 'datastore': {'v1beta3': APIDef('googlecloudsdk.third_party.apis.datastore.v1beta3.datastore_v1beta3_client.DatastoreV1beta3', 'googlecloudsdk.third_party.apis.datastore.v1beta3.datastore_v1beta3_messages', True)}, 'pubsub': {'v1': APIDef('googlecloudsdk.third_party.apis.pubsub.v1.pubsub_v1_client.PubsubV1', 'googlecloudsdk.third_party.apis.pubsub.v1.pubsub_v1_messages', True)}, 'container': {'v1': APIDef('googlecloudsdk.third_party.apis.container.v1.container_v1_client.ContainerV1', 'googlecloudsdk.third_party.apis.container.v1.container_v1_messages', True)}, 'clouddebugger': {'v2': APIDef('googlecloudsdk.third_party.apis.clouddebugger.v2.clouddebugger_v2_client.ClouddebuggerV2', 'googlecloudsdk.third_party.apis.clouddebugger.v2.clouddebugger_v2_messages', True)}, 'manager': {'v1beta2': APIDef('googlecloudsdk.third_party.apis.manager.v1beta2.manager_v1beta2_client.ManagerV1beta2', 'googlecloudsdk.third_party.apis.manager.v1beta2.manager_v1beta2_messages', True)}, 'cloudbuild': {'v1': APIDef('googlecloudsdk.third_party.apis.cloudbuild.v1.cloudbuild_v1_client.CloudbuildV1', 'googlecloudsdk.third_party.apis.cloudbuild.v1.cloudbuild_v1_messages', True)}, 'bigquery': {'v2': APIDef('googlecloudsdk.third_party.apis.bigquery.v2.bigquery_v2_client.BigqueryV2', 'googlecloudsdk.third_party.apis.bigquery.v2.bigquery_v2_messages', True)}, 'testing': {'v1': APIDef('googlecloudsdk.third_party.apis.testing.v1.testing_v1_client.TestingV1', 'googlecloudsdk.third_party.apis.testing.v1.testing_v1_messages', True)}, 'dns': {'v1beta1': APIDef('googlecloudsdk.third_party.apis.dns.v1beta1.dns_v1beta1_client.DnsV1beta1', 'googlecloudsdk.third_party.apis.dns.v1beta1.dns_v1beta1_messages', False), 'v1': APIDef('googlecloudsdk.third_party.apis.dns.v1.dns_v1_client.DnsV1', 'googlecloudsdk.third_party.apis.dns.v1.dns_v1_messages', True)}, 'genomics': {'v1alpha2': APIDef('googlecloudsdk.third_party.apis.genomics.v1alpha2.genomics_v1alpha2_client.GenomicsV1alpha2', 'googlecloudsdk.third_party.apis.genomics.v1alpha2.genomics_v1alpha2_messages', False), 'v1': APIDef('googlecloudsdk.third_party.apis.genomics.v1.genomics_v1_client.GenomicsV1', 'googlecloudsdk.third_party.apis.genomics.v1.genomics_v1_messages', True)}, 'storage': {'v1': APIDef('googlecloudsdk.third_party.apis.storage.v1.storage_v1_client.StorageV1', 'googlecloudsdk.third_party.apis.storage.v1.storage_v1_messages', True)}, 'replicapool': {'v1beta2': APIDef('googlecloudsdk.third_party.apis.replicapool.v1beta2.replicapool_v1beta2_client.ReplicapoolV1beta2', 'googlecloudsdk.third_party.apis.replicapool.v1beta2.replicapool_v1beta2_messages', True)}, 'apikeys': {'v1': APIDef('googlecloudsdk.third_party.apis.apikeys.v1.apikeys_v1_client.ApikeysV1', 'googlecloudsdk.third_party.apis.apikeys.v1.apikeys_v1_messages', True)}, 'servicemanagement': {'v1': APIDef('googlecloudsdk.third_party.apis.servicemanagement.v1.servicemanagement_v1_client.ServicemanagementV1', 'googlecloudsdk.third_party.apis.servicemanagement.v1.servicemanagement_v1_messages', True)}, 'clouduseraccounts': {'beta': APIDef('googlecloudsdk.third_party.apis.clouduseraccounts.beta.clouduseraccounts_beta_client.ClouduseraccountsBeta', 'googlecloudsdk.third_party.apis.clouduseraccounts.beta.clouduseraccounts_beta_messages', True), 'alpha': APIDef('googlecloudsdk.third_party.apis.clouduseraccounts.alpha.clouduseraccounts_alpha_client.ClouduseraccountsAlpha', 'googlecloudsdk.third_party.apis.clouduseraccounts.alpha.clouduseraccounts_alpha_messages', False)}, 'iam': {'v1': APIDef('googlecloudsdk.third_party.apis.iam.v1.iam_v1_client.IamV1', 'googlecloudsdk.third_party.apis.iam.v1.iam_v1_messages', True)}, 'cloudfunctions': {'v1beta1': APIDef('googlecloudsdk.third_party.apis.cloudfunctions.v1beta1.cloudfunctions_v1beta1_client.CloudfunctionsV1beta1', 'googlecloudsdk.third_party.apis.cloudfunctions.v1beta1.cloudfunctions_v1beta1_messages', True)}, 'source': {'v1': APIDef('googlecloudsdk.third_party.apis.source.v1.source_v1_client.SourceV1', 'googlecloudsdk.third_party.apis.source.v1.source_v1_messages', True)}, 'bigtableclusteradmin': {'v1': APIDef('googlecloudsdk.third_party.apis.bigtableclusteradmin.v1.bigtableclusteradmin_v1_client.BigtableclusteradminV1', 'googlecloudsdk.third_party.apis.bigtableclusteradmin.v1.bigtableclusteradmin_v1_messages', True)}, 'dataproc': {'v1': APIDef('googlecloudsdk.third_party.apis.dataproc.v1.dataproc_v1_client.DataprocV1', 'googlecloudsdk.third_party.apis.dataproc.v1.dataproc_v1_messages', True)}, 'dataflow': {'v1b3': APIDef('googlecloudsdk.third_party.apis.dataflow.v1b3.dataflow_v1b3_client.DataflowV1b3', 'googlecloudsdk.third_party.apis.dataflow.v1b3.dataflow_v1b3_messages', True)}, 'logging': {'v1beta3': APIDef('googlecloudsdk.third_party.apis.logging.v1beta3.logging_v1beta3_client.LoggingV1beta3', 'googlecloudsdk.third_party.apis.logging.v1beta3.logging_v1beta3_messages', True), 'v2beta1': APIDef('googlecloudsdk.third_party.apis.logging.v2beta1.logging_v2beta1_client.LoggingV2beta1', 'googlecloudsdk.third_party.apis.logging.v2beta1.logging_v2beta1_messages', False)}, 'autoscaler': {'v1beta2': APIDef('googlecloudsdk.third_party.apis.autoscaler.v1beta2.autoscaler_v1beta2_client.AutoscalerV1beta2', 'googlecloudsdk.third_party.apis.autoscaler.v1beta2.autoscaler_v1beta2_messages', True)}, 'cloudbilling': {'v1': APIDef('googlecloudsdk.third_party.apis.cloudbilling.v1.cloudbilling_v1_client.CloudbillingV1', 'googlecloudsdk.third_party.apis.cloudbilling.v1.cloudbilling_v1_messages', True)}, 'deploymentmanager': {'v2': APIDef('googlecloudsdk.third_party.apis.deploymentmanager.v2.deploymentmanager_v2_client.DeploymentmanagerV2', 'googlecloudsdk.third_party.apis.deploymentmanager.v2.deploymentmanager_v2_messages', True)}, 'sqladmin': {'v1beta3': APIDef('googlecloudsdk.third_party.apis.sqladmin.v1beta3.sqladmin_v1beta3_client.SqladminV1beta3', 'googlecloudsdk.third_party.apis.sqladmin.v1beta3.sqladmin_v1beta3_messages', True), 'v1beta4': APIDef('googlecloudsdk.third_party.apis.sqladmin.v1beta4.sqladmin_v1beta4_client.SqladminV1beta4', 'googlecloudsdk.third_party.apis.sqladmin.v1beta4.sqladmin_v1beta4_messages', False)}, 'cloudresourcemanager': {'v1beta1': APIDef('googlecloudsdk.third_party.apis.cloudresourcemanager.v1beta1.cloudresourcemanager_v1beta1_client.CloudresourcemanagerV1beta1', 'googlecloudsdk.third_party.apis.cloudresourcemanager.v1beta1.cloudresourcemanager_v1beta1_messages', True)}, 'resourceviews': {'v1beta1': APIDef('googlecloudsdk.third_party.apis.resourceviews.v1beta1.resourceviews_v1beta1_client.ResourceviewsV1beta1', 'googlecloudsdk.third_party.apis.resourceviews.v1beta1.resourceviews_v1beta1_messages', True)}, 'replicapoolupdater': {'v1beta1': APIDef('googlecloudsdk.third_party.apis.replicapoolupdater.v1beta1.replicapoolupdater_v1beta1_client.ReplicapoolupdaterV1beta1', 'googlecloudsdk.third_party.apis.replicapoolupdater.v1beta1.replicapoolupdater_v1beta1_messages', True)}}
