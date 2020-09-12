#!/usr/bin/env ruby
# This is free and unencumbered software released into the public domain.

require 'json'

begin
  require 'arweave'
rescue LoadError
  abort "Arweave library not available: execute `gem install arweave`"
end

begin
  require 'rugged'
rescue LoadError
  abort "Git library not available: execute `gem install rugged`"
end

GITSTAMP_KEYFILE = ENV['GITSTAMP_KEYFILE']

if GITSTAMP_KEYFILE.nil? || GITSTAMP_KEYFILE.empty? || !File.exist?(GITSTAMP_KEYFILE)
  abort "GITSTAMP_KEYFILE environment variable must have a valid JWK path."
end

begin
  wallet = Arweave::Wallet.new(JSON.parse(File.read(GITSTAMP_KEYFILE)))
rescue JSON::ParserError => error
  abort "#{GITSTAMP_KEYFILE}: #{error}"
end

git = Rugged::Repository.new('.')

commits = ARGV.empty? ? [git.head.target] : ARGV.map { |sha1| git.lookup(sha1) }

commits.each do |commit|
  metadata = {
    'Content-Type' => 'text/plain',
    'App-Name' => 'Gitstamp',
    'Git-Commit' => commit.oid,
    'Git-Author' => "mailto:#{commit.author.email}",
    'Git-Committer' => "mailto:#{commit.committer.email}",
    'Git-Committer-Date' => commit.committer[:time].strftime("%Y-%m-%dT%H:%M:%S%:z"),
  }
  transaction = Arweave::Transaction.new(data: commit.message)
  metadata.each do |name, value|
    transaction.add_tag(name: name, value: value)
  end
  transaction.sign(wallet)
  puts transaction.attributes[:id]
  transaction.commit
end
