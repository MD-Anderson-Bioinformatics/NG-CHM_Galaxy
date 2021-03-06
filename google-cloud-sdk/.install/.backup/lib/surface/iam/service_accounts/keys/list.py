# Copyright 2015 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Command for listing service account keys."""

from datetime import datetime
import textwrap

from googlecloudsdk.api_lib.iam import base_classes
from googlecloudsdk.api_lib.iam import data_formats
from googlecloudsdk.api_lib.iam import utils
from googlecloudsdk.calliope import arg_parsers


ZULU_FORMAT = '%Y-%m-%dT%H:%M:%SZ'


class List(base_classes.BaseIamCommand):
  """List the keys for a service account."""

  detailed_help = {
      'DESCRIPTION': '{description}',
      'EXAMPLES': textwrap.dedent("""\
          To list all user-managed keys created before noon on July 19th, 2015
          (to perform key rotation, for example), run:

            $ {command} --iam-account my-iam-account@somedomain.com --managed-by user --created-before 2015-07-19T12:00:00Z
          """),
  }

  @staticmethod
  def Args(parser):
    parser.add_argument('--managed-by',
                        choices=['user', 'system', 'any'],
                        default='any',
                        help='The types of keys to list. Can be "any", "user"'
                        'or "system". When not specified, defaults to "any".')

    parser.add_argument(
        '--created-before',
        type=arg_parsers.Datetime.Parse,
        help=('Return only keys created before the specified time. '
              'The timestamp must be in RFC3339 UTC "Zulu" format.'))

    parser.add_argument('--iam-account',
                        required=True,
                        help='A textual name to display for the account.')

  @utils.CatchServiceAccountErrors
  def Run(self, args):
    self.SetAddress(args.iam_account)
    result = self.iam_client.projects_serviceAccounts_keys.List(
        self.messages.IamProjectsServiceAccountsKeysListRequest(
            name=utils.EmailToAccountResourceName(args.iam_account),
            keyTypes=utils.ManagedByFromString(args.managed_by)))

    keys = result.keys
    if args.created_before:
      timestamp = args.created_before
      keys = [key
              for key in keys
              if datetime.strptime(key.validAfterTime, ZULU_FORMAT) < timestamp]

    # TODO(user): We can't use the default list printing functions until
    # there is support for atomic names. This property is the equivalent of
    # a COLUMN_MAP for the list printer. To be removed in the future.
    self.data_format = data_formats.SERVICE_ACCOUNT_KEY_COLUMNS
    return keys
